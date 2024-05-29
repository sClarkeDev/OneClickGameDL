// ==UserScript==
// @name         OneClickGameDL
// @namespace    http://tampermonkey.net/
// @version      2024-05-29
// @description  Adds one click torrent links to popular gaming websites.
// @author       You
// @match        https://store.steampowered.com/app*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tampermonkey.net
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    const VERIFIED_UPLOADERS = ['DODI', 'FITGIRL', 'KaOsKrew']
    
    const STEAM_URL = 'https://store.steampowered.com'

    const getGameName = () => {
        const name = document.getElementById('appHubAppName').innerHTML;
        return name;
    }

    const request = async (path) => {
        const url = `https://cors-proxy.sclarkedev.workers.dev?destination=${path}`
        const response = await GM.xmlHttpRequest({ url })
        return response.responseText;
    }

    const compareNames = (name1, name2) => {
        const normalize = (name) => {
            return name.toLowerCase().replace(/[^a-z0-9]/g, '');
        };

        const normalizedOfficialName = normalize(name1);
        const normalizedWebName = normalize(name2);

        return normalizedWebName.includes(normalizedOfficialName);
    };


    const addDownloadButton = (url) => {
         const downloadButtonHTML = `
        <div class="game_area_purchase_game_wrapper">
            <div class="game_area_purchase_game">
                <h1>Download ${getGameName()}</h1>
                <div class="game_purchase_action">
                    <div class="game_purchase_action_bg">
                        <div class="game_purchase_price price" data-price-final="Free">Free</div>
                        <div class="btn_addtocart">
                            <a class="btn_green_steamui btn_medium" href="${url}">
                                <span>Download Now</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

        const purchaseSection = document.getElementById('game_area_purchase');
        purchaseSection?.insertAdjacentHTML('afterbegin', downloadButtonHTML);
    }

    const addLoadingIndicator = (url) => {
         const loadingHTML = `
        <div id="sclarkedev-searching" class="game_area_purchase_game_wrapper">
            <div class="game_area_purchase_game">
                <h1>Searching for ${getGameName()}</h1>
            </div>
        </div>`;

        const purchaseSection = document.getElementById('game_area_purchase');
        purchaseSection?.insertAdjacentHTML('afterbegin', loadingHTML);
    }

    const getLink = async () => {
        addLoadingIndicator();

        const gameName = getGameName();
        const baseUrl = 'https://1337x.to'
        const searchUrl = `${baseUrl}/sort-category-search/${encodeURIComponent(gameName)}/Games/seeders/desc/1/`
        const searchRes = await request(searchUrl);

        const parser = new DOMParser();
        const doc = parser.parseFromString(searchRes, 'text/html');

        const resultsTable = doc.querySelector('.table-list tbody');
        if (!resultsTable) return;

        let pageUrl = null;
        const rows = resultsTable.querySelectorAll('tr');
        rows.forEach(row => {
            const nameLinks = row.querySelectorAll('td.name a');
            const name = nameLinks[1]?.textContent;
            const uploader = row.querySelector('td.vip a')?.textContent;

            if (uploader && VERIFIED_UPLOADERS.includes(uploader) && compareNames(gameName, name)) {
                pageUrl = nameLinks[1]?.href.replace(STEAM_URL, baseUrl);
                return;
            }
        });

        if (!pageUrl) return;

        const pageRes = await request(pageUrl);
        const pageDoc = parser.parseFromString(pageRes, 'text/html');

        const magnet = pageDoc.querySelector('div.no-top-radius > div > ul > li:first-child > a')?.href;
        if (!magnet) return;

        return magnet;
    }

    const run = async () => {
        try {
            const link = await getLink();
            document.getElementById('sclarkedev-searching').remove();

            if (!link) return;
            addDownloadButton(link);
        } catch (err) {
            console.error(err);
        }
    }

    setTimeout(run, 300)
})();