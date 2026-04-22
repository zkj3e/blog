import type { ChildProcess } from 'node:child_process';

import {
  clickElement,
  evaluate,
  findExistingChromeDebugPort,
  getPageSession,
  launchChrome,
  sleep,
  tryConnectExisting,
  waitForNewTab,
  type ChromeSession,
  type CdpConnection,
} from '/Users/bigo/.codex/skills/baoyu-post-to-wechat/scripts/cdp.ts';

const WECHAT_URL = 'https://mp.weixin.qq.com/';

async function waitForElement(session: ChromeSession, selector: string, timeoutMs = 30_000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const exists = await evaluate<boolean>(
      session,
      `(function () {
        const el = document.querySelector(${JSON.stringify(selector)});
        return !!el && getComputedStyle(el).display !== 'none';
      })()`,
    );
    if (exists) return true;
    await sleep(500);
  }
  return false;
}

async function clickMenuByText(session: ChromeSession, text: string): Promise<void> {
  const clicked = await evaluate<boolean>(
    session,
    `(function () {
      const nodes = Array.from(document.querySelectorAll('a, button, div, span'));
      const target = nodes.find((el) => (el.textContent || '').trim() === ${JSON.stringify(text)});
      if (!target) return false;
      target.click();
      return true;
    })()`,
  );

  if (!clicked) {
    throw new Error(`Menu "${text}" not found`);
  }
}

async function openEditor(cdp: CdpConnection, chrome: ChildProcess | null): Promise<ChromeSession> {
  let session: ChromeSession;

  if (!chrome) {
    const allTargets = await cdp.send<{ targetInfos: Array<{ targetId: string; url: string; type: string }> }>('Target.getTargets');
    const loggedInTab = allTargets.targetInfos.find(
      (t) => t.type === 'page' && t.url.includes('mp.weixin.qq.com') && t.url.includes('token='),
    );
    const wechatTab = loggedInTab || allTargets.targetInfos.find((t) => t.type === 'page' && t.url.includes('mp.weixin.qq.com'));
    if (!wechatTab) {
      await cdp.send('Target.createTarget', { url: WECHAT_URL });
      await sleep(5000);
      session = await getPageSession(cdp, 'mp.weixin.qq.com');
    } else {
      const { sessionId } = await cdp.send<{ sessionId: string }>('Target.attachToTarget', {
        targetId: wechatTab.targetId,
        flatten: true,
      });
      await cdp.send('Page.enable', {}, { sessionId });
      await cdp.send('Runtime.enable', {}, { sessionId });
      await cdp.send('DOM.enable', {}, { sessionId });
      session = { cdp, sessionId, targetId: wechatTab.targetId };
    }
  } else {
    session = await getPageSession(cdp, 'mp.weixin.qq.com');
  }

  const allTargets = await cdp.send<{ targetInfos: Array<{ targetId: string; url: string; type: string }> }>('Target.getTargets');
  const tokenHomeTab = allTargets.targetInfos.find(
    (target) => target.type === 'page' && target.url.includes('/cgi-bin/home') && target.url.includes('token='),
  );
  if (tokenHomeTab) {
    const { sessionId } = await cdp.send<{ sessionId: string }>('Target.attachToTarget', {
      targetId: tokenHomeTab.targetId,
      flatten: true,
    });
    await cdp.send('Page.enable', {}, { sessionId });
    await cdp.send('Runtime.enable', {}, { sessionId });
    await cdp.send('DOM.enable', {}, { sessionId });
    session = { cdp, sessionId, targetId: tokenHomeTab.targetId };
  }

  const currentUrl = await evaluate<string>(session, 'window.location.href');
  if (!currentUrl.includes('/cgi-bin/home')) {
    const tokenMatch = currentUrl.match(/token=([^&]+)/);
    const tokenSuffix = tokenMatch ? `&token=${tokenMatch[1]}&lang=zh_CN` : '';
    await evaluate(session, `window.location.href = '${WECHAT_URL}cgi-bin/home?t=home/index${tokenSuffix}'`);
    await sleep(5000);
  }

  const menuReady = await waitForElement(session, '.new-creation__menu', 40_000);
  if (!menuReady) throw new Error('Home page menu did not load');

  const targets = await cdp.send<{ targetInfos: Array<{ targetId: string; url: string; type: string }> }>('Target.getTargets');
  const initialIds = new Set(targets.targetInfos.map((target) => target.targetId));

  await clickMenuByText(session, '文章');
  await sleep(3000);

  const editorTargetId = await waitForNewTab(cdp, initialIds, 'mp.weixin.qq.com');
  const { sessionId } = await cdp.send<{ sessionId: string }>('Target.attachToTarget', {
    targetId: editorTargetId,
    flatten: true,
  });

  session = { cdp, sessionId, targetId: editorTargetId };
  await cdp.send('Page.enable', {}, { sessionId });
  await cdp.send('Runtime.enable', {}, { sessionId });
  await cdp.send('DOM.enable', {}, { sessionId });

  const editorLoaded = await waitForElement(session, '#title', 30_000);
  if (!editorLoaded) throw new Error('Editor did not load');
  await waitForElement(session, '.ProseMirror', 15_000);
  await sleep(1500);

  return session;
}

export async function publishWechatDraft(options: {
  title: string;
  summary: string;
  bodyHtml: string;
  profileDir?: string;
  cdpPort?: number;
}): Promise<{ saved: boolean; wordCount: string }> {
  let cdp: CdpConnection;
  let chrome: ChildProcess | null = null;

  const portToTry = options.cdpPort ?? await findExistingChromeDebugPort();
  if (portToTry) {
    const existing = await tryConnectExisting(portToTry);
    if (existing) {
      cdp = existing;
    } else {
      const launched = await launchChrome(WECHAT_URL, options.profileDir);
      cdp = launched.cdp;
      chrome = launched.chrome;
    }
  } else {
    const launched = await launchChrome(WECHAT_URL, options.profileDir);
    cdp = launched.cdp;
    chrome = launched.chrome;
  }

  try {
    await sleep(3000);
    const session = await openEditor(cdp, chrome);

    await evaluate(
      session,
      `(function () {
        const titleEl = document.querySelector('#title');
        if (!titleEl) return false;
        titleEl.focus();
        titleEl.value = ${JSON.stringify(options.title)};
        titleEl.dispatchEvent(new Event('input', { bubbles: true }));
        titleEl.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      })()`,
    );

    await clickElement(session, '.ProseMirror');
    await sleep(300);
    await evaluate(
      session,
      `(function () {
        const editor = document.querySelector('.ProseMirror');
        if (!editor) return JSON.stringify({ ok: false });
        editor.focus();
        editor.innerHTML = ${JSON.stringify(options.bodyHtml)};
        editor.dispatchEvent(new Event('input', { bubbles: true }));
        editor.dispatchEvent(new Event('change', { bubbles: true }));
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(editor);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
        return JSON.stringify({
          ok: true,
          textLength: (editor.innerText || '').trim().length
        });
      })()`,
    );
    await sleep(1500);

    await evaluate(
      session,
      `(function () {
        const el = document.querySelector('#js_description');
        if (!el) return false;
        el.focus();
        el.value = ${JSON.stringify(options.summary)};
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      })()`,
    );
    await sleep(500);

    await evaluate(session, `document.querySelector('#js_submit button')?.click()`);
    await sleep(5000);

    const result = await evaluate<{ saved: boolean; wordCount: string }>(
      session,
      `(function () {
        const text = document.body.innerText || '';
        const wordCount = (text.match(/正文字数\\s*(\\d+)/) || [])[1] || '';
        return {
          saved: text.includes('手动保存') || text.includes('已保存') || Number(wordCount || '0') > 0,
          wordCount
        };
      })()`,
    );

    return result;
  } finally {
    cdp.close();
    if (chrome) {
      chrome.kill();
    }
  }
}
