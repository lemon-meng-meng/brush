// ==UserScript==
// @name         抖音分享链接清理工具
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  自动清理抖音分享链接中的多余文字并跳转到纯链接
// @author       You
// @match        *://*/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // 检查当前页面是否是浏览器地址栏
    if (window.performance && window.performance.navigation.type === window.performance.navigation.TYPE_NAVIGATE) {
        // 获取当前URL
        let currentUrl = window.location.href;
        
        // 抖音链接正则表达式
        const douyinUrlRegex = /https?:\/\/v\.douyin\.com\/[a-zA-Z0-9_-]+\/?/;
        
        // 检查URL中是否包含抖音链接
        const match = currentUrl.match(douyinUrlRegex);
        
        if (match) {
            // 提取纯抖音链接
            const cleanUrl = match[0];
            
            // 如果提取的链接与当前URL不同，则进行跳转
            if (cleanUrl !== currentUrl) {
                window.location.replace(cleanUrl);
            }
        }
    }

    // 监听粘贴事件，在搜索框粘贴时清理内容
    document.addEventListener('paste', function(e) {
        // 检查目标是否是输入框或文本域
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
            // 获取剪贴板数据
            const clipboardData = e.clipboardData || window.clipboardData;
            const pastedText = clipboardData.getData('text');
            
            // 抖音链接正则表达式
            const douyinUrlRegex = /https?:\/\/v\.douyin\.com\/[a-zA-Z0-9_-]+\/?/;
            
            // 检查粘贴内容中是否包含抖音链接
            const match = pastedText.match(douyinUrlRegex);
            
            if (match) {
                // 阻止默认粘贴行为
                e.preventDefault();
                
                // 插入清理后的链接
                const cleanUrl = match[0];
                document.execCommand('insertText', false, cleanUrl);
                
                // 如果是搜索框，可以自动提交（可选）
                if (e.target.tagName === 'INPUT' && e.target.type === 'search') {
                    e.target.form && e.target.form.submit();
                }
            }
        }
    });
})();