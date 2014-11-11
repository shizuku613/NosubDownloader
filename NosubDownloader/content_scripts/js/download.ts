// Path: content_scripts/js/download.js
// License: GPLv3<http://www.gnu.org/licenses/>
// Author: shizuku613<https://github.com/shizuku613>
// Copyright (C) KONO Shizuku 2014

/// <reference path="../../../typings/chrome/chrome.d.ts" />
/// <reference path="../../../typings/underscore/underscore.d.ts" />
/// <reference path="../../../typings/zepto/zepto.d.ts" />
/// <reference path="../../../typings/md5/md5.d.ts" />

module nosub.contentScripts.download {
    'use strict';

    var undefined = void 0;

    var FC2_MAGICK = '_gGddgPfeaf_gzyr';
    var SCRIPT_START_INTERVAL = 50; // ms

    var VIDEO_SCRIPT_SELECTOR = '#mkplayer-content + script';
    var VIDEO_SELECT_SELECTOR = '#mkplayer-sectsel select';
    var ADD_VIDEO_CUSTOM_EVENT = 'custom:addvideo';

    interface Video {
        url?: string;
        urls?: string[];
    }

    var videos: Video[] = [];
    var downloadButton: ZeptoCollection = null;
    var errorAlertShowed = false;

    function parseParams(str: string) {
        var params: { [key: string]: string } = {};

        var pairs = str.split('&');

        _.each(pairs, pair => {
            var index = pair.indexOf('=');

            if (index > 0) {
                var key = pair.slice(0, index);
                var value = pair.slice(index + 1);
                params[key] = value;
            }
        });

        return params;
    }

    function getFc2VideoDownloadUrl(vid: string, cb: (url: string) => void) {
        var getInfoUrl = 'http://video.fc2.com/ginfo.php?mimi=' +
            CybozuLabs.MD5.calc(vid + FC2_MAGICK) +
            '&v=' + vid + '&upid=' + vid + '&otag=1';
        //console.log(getInfoUrl);

        $.get(getInfoUrl, data => {
            var params = parseParams(data);

            if (params['filepath'] && params['mid']) {
                var videoUrl = params['filepath'] + '?mid=' + params['mid'];
                //console.log(videoUrl);

                cb(videoUrl);
            }
        });
    }

    function parseVideoScript() {
        var pageScript = $(VIDEO_SCRIPT_SELECTOR);
        //console.log(script[0]);
        //console.log(script.text());

        var scriptText = pageScript.text();
        scriptText = scriptText.replace(/addVideo\(/g, 'addVideoDownloaderPipe(');
        scriptText = scriptText.replace(/renderVideo\(/g, 'renderVideoDownloader(');

        // カスタムイベント経由でコンテンツスクリプトを呼び出すコード
        // グローバル関数経由だと、実行は行われるがエラーが出るため、それの回避
        var dispatchCustomEventScript =
            'function addVideoDownloaderPipe() {' +
                'var args = Array.prototype.slice.call(arguments);' + // 引数を配列に変換
                'var event = new CustomEvent("' + ADD_VIDEO_CUSTOM_EVENT + '", { detail: args });' +
                'var elem = document.getElementsByTagName("html")[0];' +
                'elem.dispatchEvent(event);' + // 実際にイベントを発生させる
            '}' +
            'function renderVideoDownloader() { }';

        var newScript = $('<script />');
        newScript.text(dispatchCustomEventScript + ';' + scriptText);
        
        //console.log(newScript);

        $('head').append(newScript);
    }

    function setDownloadLink(): void {
        var element = downloadButton;
        if (element == null) return;

        var select = $(VIDEO_SELECT_SELECTOR);
        var selectedIndex = 0; // Default source

        // If exist select box
        if (select.length > 0) {
            selectedIndex = parseInt(select.val(), 10);
        }
        
        // Clear download buttons
        element.find('.download').empty();

        if (videos[selectedIndex]) {
            var video = videos[selectedIndex];

            var addButton = (url: string, text: string) => {
                var link = $('<a download />')
                    .text(text)
                    .attr('href', url)
                    .css({
                        cursor: 'pointer',
                        margin: '0 3px 0 0'
                    });

                element.find('.download')
                    .append(link);
            };

            // 複数 URL データでも、URL がひとつな場合、データを加工
            if (video['urls'] && video['urls'].length == 1) {
                var temp = video['urls'][0];
                video['urls'] = undefined;
                video['url'] = temp;
            }

            if (video['url']) {
                addButton(video['url'], chrome.i18n.getMessage('downloadButtonText'));
            }

            else if (video['urls']) {
                _.each(video['urls'], (url, index) => {
                    if (index == 0) {
                        addButton(url, chrome.i18n.getMessage('downloadButtonText') + ' [1]');
                    }

                    else {
                        addButton(url, '[' + (index + 1) + ']');
                    }
                });
            }
            
            else {
                element.find('.download')
                    .text(chrome.i18n.getMessage('downloadButtonErrorText'));
            }
        }

        else {
            element.find('.download')
                .text(chrome.i18n.getMessage('downloadButtonErrorText'));
        }
    }

    function changeVideoSelected(e: Event): boolean {
        setDownloadLink();
        return undefined;
    }

    function createDownloadButton() {
        var button = $(
            '<span class="wrap">' +
            '<span class="download"></span> ' +
            '<small class="description"></small> ' +
            '<small class="form"><a href="#"></a></small> ' +
            '<small class="settings"><a href="#" target="_blank">#</a></small>' +
            '</span>');

        button
            .css({
                margin: '0 0 0 5px',
                padding: '2px 5px'
            });

        button.find('small.description')
            .text(chrome.i18n.getMessage('downloadDescription'));

        button.find('small.form a')
            .text(chrome.i18n.getMessage('inquiryFormLinkText'))
            .click(showModalWindow);

        button.find('small.settings a')
            .text(chrome.i18n.getMessage('settingsLinkText'))
            .prop('href', chrome.extension.getURL('options_page/html/options_page.html'));

        $('#mkplayer-sectsel').append(button);
        downloadButton = button;
    };

    /**
     * イベントを追加する
     */
    function addEvents(): void {
        var select = $(VIDEO_SELECT_SELECTOR);
        select.change(changeVideoSelected);
    }

    /**
     * カスタムイベントを追加する
     */
    function addCustomEvents(): void {
        var elem = document.getElementsByTagName('html')[0];

        // 再生動画を追加するイベント
        elem.addEventListener(ADD_VIDEO_CUSTOM_EVENT, event => {
            var customEvent = <CustomEvent>event;
            var args = <any[]>customEvent.detail;
            addVideoDownloader.apply(null, args);
        });
    }

    /**
     * スクリプトを開始してよい場合に true を返す
     * Return true if the script may begin
     */
    function isScriptCanStart(): boolean {
        // VIDEO_SELECT_SELECTOR は存在しないページがあるため、
        // ここには加えない
        var selectors = [VIDEO_SCRIPT_SELECTOR];

        // すべてのセレクタの要素が存在する場合に true
        return _.every(selectors, s => $(s).length > 0);
    }

    /**
     * モーダルウィンドウを表示する
     */
    function showModalWindow(e: Event): void {
        // イベント伝搬停止
        e.stopPropagation();
        e.preventDefault();

        // ウィンドウを表示
        bugReport.showInquiryWindow();
    }

    function startScript(): void {
        // 開始できない場合、遅延させる
        if (!isScriptCanStart()) {
            _.delay(startScript, SCRIPT_START_INTERVAL);
            return;
        }

        addCustomEvents();
        parseVideoScript();
        createDownloadButton();
        addEvents();
        setDownloadLink();
    }

    /**
     * 拡張子不明なビデオリンクが追加された際のメッセージを送信する
     */
    function sendAddVideoUrlsMessage(urls: string[]): void {
        var title = $('h1.title').text() || document.title;
        var message: AddVideoUrlsMessage = {
            type: ADD_VIDEO_URLS_MESSAGE_TYPE,
            urls: urls,
            fileName: title
        };

        chrome.runtime.sendMessage(message);
    }

    function addVideoDownloader(
        w: number,
        h: number,
        flashvars: string,
        ptitle: string,
        description: string,
        player: string): void {

        var params = parseParams(flashvars);
        var index = videos.length;
        videos.push({});

        var updateVideoUrl = (url: string, type: string) => {
            if (url) {
                updateVideoUrls([url], type);
            }
        };

        var updateVideoUrls = (urls: string[], type: string) => {
            if (urls) {
                videos[index] = { urls: urls };
                setDownloadLink();
            }
        };

        switch (params['type']) {
            case 'video':
            case 'sound':
                updateVideoUrl(params['file'], params['type']);

                if (params['type'] == 'video' && params['file']) {
                    sendAddVideoUrlsMessage([params['file']]);
                }

                break;

            case 'fc2':
                getFc2VideoDownloadUrl(params['vid'], url => {
                    updateVideoUrl(url, params['type'])
                });
                break;

            case 'qq':
            case 'veoh':
                mukiopress.getVideoDownloadUrl(
                    params['type'], params['vid'],
                    url => {
                        updateVideoUrl(url, params['type']);
                    });
                break;

            case 'sina':
                sina.getVideoDownloadUrls(params['vid'], (urls) => {
                    updateVideoUrls(urls, params['type']);
                });

                break;

            case 'xiami':
                xiami.getVideoDownloadUrl(params['vid'], urls => {
                    updateVideoUrls(urls, params['type']);
                });

                break;

            case 'empty':
                break;

            default:
                console.error('Unknown video type `' + params['type'] + '`');

                settings.getSettingBooleanValue('autoBugReport', true, value => {
                    if (value) {
                        bugReport.sendUnknownVideoTypeError(params['type']);
                    }
                });

                if (typeof DEBUG !== 'undefined') {
                    if (!errorAlertShowed) {
                        errorAlertShowed = true;
                        alert('Unknown video type `' + params['type'] + '`');
                    }
                }
        }
    }

    startScript();
}
