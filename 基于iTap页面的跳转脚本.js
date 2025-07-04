// ==UserScript==
// @name         全平台智能链接净化跳转终极版
// @namespace    http://tampermonkey.net/
// @version      3.1
// @description  支持所有搜索引擎+全平台链接净化（B站/抖音/快手/头条/爱奇艺/知乎等）
// @match        *://*/*
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // 1. 全局样式注入
    GM_addStyle(`
        #universal-url-cleaner {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px;
            background: #fff;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            z-index: 2147483647;
            max-width: 400px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            border: 1px solid rgba(0,0,0,0.1);
            animation: url-cleaner-fadein 0.3s;
            transform-origin: top right;
        }
        @keyframes url-cleaner-fadein {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }
        #universal-url-cleaner-close {
            position: absolute;
            top: 8px;
            right: 8px;
            cursor: pointer;
            opacity: 0.5;
            font-size: 18px;
        }
        #universal-url-cleaner-close:hover {
            opacity: 1;
        }
        .url-cleaner-platform-tag {
            display: inline-block;
            padding: 2px 6px;
            background: #4CAF50;
            color: white;
            border-radius: 4px;
            font-size: 12px;
            margin-right: 8px;
        }
    `);

    // 2. 超强平台识别引擎
    const PLATFORM_RULES = {
        bilibili: {
            patterns: [
                /bilibili\.com\/video\/(BV\w+|av\d+)/i,
                /b23\.tv\/\w+/i
            ],
            name: "B站",
            color: "#FB7299"
        },
        douyin: {
            patterns: [
                /douyin\.com\/video\/\w+/i,
                /v\.douyin\.com\/\w+/i
            ],
            name: "抖音",
            color: "#FE2C55"
        },
        kuaishou: {
            patterns: [
                /kuaishou\.com\/[fs]\/\w+/i,
                /gifshow\.com\/s\/\w+/i
            ],
            name: "快手",
            color: "#FFC300"
        },
        toutiao: {
            patterns: [
                /toutiao\.com\/[a-z]+\/\w+/i,
                /ixigua\.com\/\d+/i
            ],
            name: "今日头条",
            color: "#FF4D4F"
        },
        iqiyi: {
            patterns: [
                /iqiyi\.com\/[vw]_\w+\.html/i,
                /iqiyi\.com\/[a-z]+\/\d+\.html/i
            ],
            name: "爱奇艺",
            color: "#00BEFF"
        },
        zhihu: {
            patterns: [
                /zhihu\.com\/(question|answer|video|zvideo)\/\w+/i,
                /zhihu\.com\/pin\/\w+/i
            ],
            name: "知乎",
            color: "#0084FF"
        }
    };

    // 3. 终极URL提取器
    function extractPureURL(text) {
        // 第一阶段：精确匹配平台链接
        for (const [_, rule] of Object.entries(PLATFORM_RULES)) {
            for (const pattern of rule.patterns) {
                const match = text.match(pattern);
                if (match) {
                    return normalizeURL(match[0], rule.name);
                }
            }
        }

        // 第二阶段：通用URL匹配
        const urlRegex = /(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+\.[a-z]{2,}(?:\/[^\s\u4e00-\u9fa5【】［］()<>"'']*)?/i;
        const matches = text.match(urlRegex);
        if (matches && matches[0].length > 10) { // 最小长度过滤
            return normalizeURL(matches[0]);
        }

        return null;
    }

    // 4. 智能URL标准化
    function normalizeURL(url, platformName) {
        if (!url) return null;

        // 统一协议头
        if (!/^https?:\/\//i.test(url)) {
            url = 'https://' + url.replace(/^\/\//, '');
        }

        // 平台专属处理
        if (platformName === 'B站') {
            url = url.split('?')[0]; // 保留干净的视频地址
        } else if (platformName === '抖音') {
            url = url.replace(/\/\?/, '?'); // 修复错误的分隔符
        }

        return url;
    }

    // 5. 创建专业级提示框
    function createUniversalPrompt(pureURL, platform) {
        // 移除旧提示
        const oldPrompt = document.getElementById('universal-url-cleaner');
        if (oldPrompt) oldPrompt.remove();

        const prompt = document.createElement('div');
        prompt.id = 'universal-url-cleaner';
        prompt.innerHTML = `
            <div id="universal-url-cleaner-close">×</div>
            <div style="margin-bottom:10px;font-weight:bold;">
                <span class="url-cleaner-platform-tag" style="background:${platform.color}">
                    ${platform.name}
                </span>
                检测到可跳转链接
            </div>
            <div style="margin-bottom:12px;word-break:break-all;">
                <a href="${pureURL}" target="_blank" style="color:#1890ff;text-decoration:none;">
                    ${pureURL}
                </a>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <button id="universal-url-cleaner-jump" style="
                    padding:6px 16px;
                    background:#1890ff;
                    color:white;
                    border:none;
                    border-radius:4px;
                    cursor:pointer;
                ">立即跳转</button>
                <span style="font-size:12px;color:#999;">自动跳转剩余 <span id="universal-url-cleaner-countdown">3</span>秒</span>
            </div>
        `;

        document.body.appendChild(prompt);

        // 倒计时功能
        let countdown = 3;
        const countdownEl = prompt.querySelector('#universal-url-cleaner-countdown');
        const timer = setInterval(() => {
            countdown--;
            countdownEl.textContent = countdown;
            if (countdown <= 0) {
                clearInterval(timer);
                performJump(pureURL);
            }
        }, 1000);

        // 按钮事件
        prompt.querySelector('#universal-url-cleaner-jump').addEventListener('click', () => {
            clearInterval(timer);
            performJump(pureURL);
        });

        // 关闭事件
        prompt.querySelector('#universal-url-cleaner-close').addEventListener('click', () => {
            clearInterval(timer);
            prompt.style.animation = 'url-cleaner-fadein 0.3s reverse';
            setTimeout(() => prompt.remove(), 300);
        });

        return prompt;
    }

    // 6. 执行跳转（带安全检查）
    function performJump(url) {
        try {
            // 检查URL是否有效
            if (/^https?:\/\/[^\s\u4e00-\u9fa5]+$/i.test(url)) {
                window.location.href = url;
            }
        } catch (e) {
            console.error('URL跳转失败:', e);
        }
    }

    // 7. 智能搜索框检测
    function findUniversalSearchBox() {
        // 常见搜索引擎选择器
        const searchSelectors = [
            'input[type="search"]', // 通用
            'input[type="text"][name="q"]', // Google/Bing
            '#kw', // 百度
            '#sb_form_q', // Bing新版
            '#search-input', // 搜狗
            '.search-input', // 360
            '#q', // 知乎站内搜索
            '#searchText', // 少数网站
            '#search-box' // 备用
        ];

        // 查找可见的搜索框
        for (const selector of searchSelectors) {
            const inputs = document.querySelectorAll(selector);
            for (const input of inputs) {
                if (input.offsetWidth > 100 && input.offsetHeight > 10) {
                    return input;
                }
            }
        }

        return null;
    }

    // 8. 主处理器（带智能防抖）
    let processTimer = null;
    function processUniversalPage() {
        clearTimeout(processTimer);
        processTimer = setTimeout(() => {
            const searchBox = findUniversalSearchBox();
            if (!searchBox) return;

            // 检查是否是新内容
            const currentValue = searchBox.value.trim();
            if (!currentValue || currentValue === lastProcessedValue) return;
            lastProcessedValue = currentValue;

            // 提取URL
            const pureURL = extractPureURL(currentValue);
            if (!pureURL) return;

            // 识别平台
            let detectedPlatform = { name: '网页', color: '#666' };
            for (const [_, rule] of Object.entries(PLATFORM_RULES)) {
                for (const pattern of rule.patterns) {
                    if (pattern.test(pureURL)) {
                        detectedPlatform = rule;
                        break;
                    }
                }
            }

            // 显示提示
            createUniversalPrompt(pureURL, detectedPlatform);
        }, 500); // 防抖延迟
    }

    // 9. 全局监听
    let lastProcessedValue = '';
    const observer = new MutationObserver(processUniversalPage);

    function initialize() {
        // 立即检查
        processUniversalPage();

        // 设置全局监听
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true
        });

        // 监听键盘事件（针对AJAX搜索）
        document.addEventListener('keyup', processUniversalPage);
        document.addEventListener('change', processUniversalPage);

        // 监听表单提交
        document.addEventListener('submit', (e) => {
            setTimeout(processUniversalPage, 300);
        }, true);
    }

    // 10. 启动
    if (document.readyState === 'complete') {
        initialize();
    } else {
        window.addEventListener('load', initialize);
    }
})();