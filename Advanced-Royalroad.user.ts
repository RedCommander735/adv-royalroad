// ==UserScript==
// @name         Advanced Royalroad
// @namespace    https://github.com/RedCommander735
// @version      0.1.3
// @description  Makes Royalroad search infinitely scrollable and adds a minimum number of chapters filter
// @author       RedCommander735
// @match        https://www.royalroad.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=royalroad.com
// @grant        GM_xmlhttpRequest
// @grant        GM.xmlhttpRequest
// @grant        GM_addStyle
// @connect      www.royalroad.com
// @updateURL    https://raw.githubusercontent.com/RedCommander735/adv-royalroad/master/Advanced-Royalroad.user.js
// @downloadURL  https://raw.githubusercontent.com/RedCommander735/adv-royalroad/master/Advanced-Royalroad.user.js
// ==/UserScript==


(function () {
    'use strict';

    // @ts-ignore
    GM_addStyle(`
.arr-checkbox {
  webkit-transition:all .3s;
  cursor:pointer;
  display:inline-block;
  font-size:14px;
  margin-bottom:15px;
  padding-left:30px;
  position:relative;
  -moz-transition:all .3s;
  -ms-transition:all .3s;
  -o-transition:all .3s;
  transition:all .3s
}
.arr-checkbox>input {
  filter:alpha(opacity=0);
  opacity:0;
  position:absolute;
  z-index:-1
}
.arr-checkbox>span {
  background:#e6e6e6;
  border:1px solid transparent;
  height:19px;
  left:0;
  position:absolute;
  top:0;
  width:19px
}
.arr-checkbox>span:after {
  content:"";
  display:none;
  position:absolute
}
.arr-checkbox:hover>input:not([disabled])~span,
.arr-checkbox>input:checked~span,
.arr-checkbox>input:focus~span {
  webkit-transition:all .3s;
  background:#d9d9d9;
  -moz-transition:all .3s;
  -ms-transition:all .3s;
  -o-transition:all .3s;
  transition:all .3s
}
.arr-checkbox>input:checked~span:after,
.mt-radio>input:checked~span:after {
    display:block
}
.arr-checkbox:hover>input:not([disabled]):checked~span,
.arr-checkbox>input:checked~span {
    webkit-transition:all .3s;
    background:#d9d9d9;
    -moz-transition:all .3s;
    -ms-transition:all .3s;
    -o-transition:all .3s;
    transition:all .3s
}
.arr-checkbox>span:after {
    border:solid #666;
    border-width:0 2px 2px 0;
    height:10px;
    left:6px;
    top:3px;
    transform:rotate(45deg);
    width:5px
}
`)


let min_chapters: number;
let current_page: number;
let infiniscroll: boolean;
let next_page_number: number = 2;
let last_page_number: number;

    function insertAfterElement(element: HTMLElement, toInsert: HTMLElement) {
            if (element.parentNode) {
                element.parentNode.insertBefore(toInsert, element.nextSibling);
            } else {
                console.error(`Couldn't find parent node of [${element}]`)
            }
    }

    function isElementInViewport(element: HTMLElement) {

        if (!element) { return false; }

        if (element.style.display == "none") { return false; }

        var rect = element.getBoundingClientRect();

        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    function isAnyInViewport(elements: NodeListOf<Element>) {
        let isVisible = false;
        elements.forEach( (elem) => {
            if ( isElementInViewport(elem as HTMLElement) ) { isVisible = true; }
        })

        return isVisible;
    }

    function remove_fictions_under_min_chapter_limit(fictions: HTMLCollection, min_chapters: number) {
        let loaded_fictions = fictions.length
        let removed_fictions = 0;

        for (let i = 0; i < fictions.length; i++) {
            let element = fictions[i];
            const chapter_span = element.querySelector('div.row.stats > div:nth-child(5) > span')
            if (chapter_span){
                const chapters = parseInt(chapter_span.textContent!.split(' ')[0].replaceAll(',', ''), 10);
                if (chapters < min_chapters) { 
                    element.setAttribute("style", "display: none;");
                    removed_fictions++
                }
            }
        };

        return removed_fictions >= loaded_fictions;
    }

    async function get_next_search_page(url: string, page_num: number, last_page_num: number) {
        console.log(`ARS: [InfiniScroll] Loading page: ${page_num}/${last_page_num}`)

        current_page = page_num;
        const DomParser = new DOMParser();

        // @ts-ignore
        const next_page = await new Promise((resolve, reject) => { GM.xmlhttpRequest({ url, onload: resolve, onerror: reject }); })
            // @ts-ignore
            .then(resp => resp.responseText) 
            .catch(e => console.error(e));

        const next_page_dom = DomParser.parseFromString(next_page, 'text/html')
        let search_container = next_page_dom.querySelector('.search-container')!

        let fictions = search_container.querySelector('.fiction-list')!.children

        let empty_page = remove_fictions_under_min_chapter_limit(fictions, min_chapters)

        document.querySelector('div.col-md-8:nth-child(1)')!.appendChild(search_container)
        // document.querySelector('.search-container:nth-last-child(2) div.text-center')!.remove()
        const navbar = document.querySelector('.search-container:last-child div.text-center')
        if (navbar) {
            navbar.setAttribute("style", "visibility: hidden; height: 0px");
        }
        

        next_page_number++

        if (empty_page) { 
            const fiction_list = document.querySelector('.search-container:last-child div.fiction-list') as HTMLElement;
            if (fiction_list) {
                let next_button = document.createElement('div')
                next_button.classList.add('next_button')
                next_button.innerText = 'LOAD MORE'
                next_button.addEventListener('click', (event) => {
                    if (infiniteScrollingHandler() && next_page_number <= last_page_number && next_page_number > current_number) {
                        current_number = next_page_number;
                        let next_page_link = base_link + `&page=${next_page_number}`
                        get_next_search_page(next_page_link, next_page_number, last_page_number);
                    }
                });
                insertAfterElement(fiction_list, next_button)
            }
        };
    }

    function getCookie(name: string) {
        let match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        if (match) return match[2];
    }

    if (getCookie('rrl_style') == 'dark') {
        // @ts-ignore
        GM_addStyle(`
            .mt-checkbox span {
                border-color: hsla(0,0%,39%,.8) !important;
            }
        `)
    }

    const urlParams = new URLSearchParams(window.location.search)

    current_page = parseInt( urlParams.get('page') ? urlParams.get('page')! : '1', 10)

    min_chapters = parseInt( urlParams.get('minChapters') ? urlParams.get('minChapters')! : '0', 10)

    infiniscroll = ( urlParams.get('infiniscroll') == 'true' ? true : false)


    const min_chapters_html = `<div class="form-group">
                                   <label>Minimum Chapter Count</label>
                                   <input type="number" step="1" class="text-center col-xs-4 col-md-3 col-lg-2" name="minChapters" id="minChapters" value="${min_chapters}" style="margin-bottom: 15px">
                               </div>`

    const scroll_html = `<div class="form-group">
                             <label class="arr-checkbox" id="infiniscroll_label">
                                 <input type="text" name="infiniscroll" id="infiniscroll_text" style="display: none;" value="${infiniscroll}" />
                                 <input id="infiniscroll" value="true" type="checkbox"> Infinite scrolling
                                 <span></span>
                             </label>
                         </div>`

    const DomParser = new DOMParser();
    const scroll_dom = DomParser.parseFromString(scroll_html, 'text/html');
    const scroll = scroll_dom.querySelector('div.form-group')! as HTMLElement;
    const scroll_label = scroll.querySelector('#infiniscroll_label')!;
    const scroll_text = scroll.querySelector('#infiniscroll_text')! as HTMLInputElement;
    const scroll_checkbox = scroll.querySelector('#infiniscroll')! as HTMLInputElement;
    const rating = document.querySelector('div.form-group:nth-child(15)')! as HTMLElement;

    const chapter_dom = DomParser.parseFromString(min_chapters_html, 'text/html');
    const chapter = chapter_dom.querySelector('div.form-group') as HTMLElement;
    insertAfterElement(rating, scroll);
    insertAfterElement(scroll, chapter);

    scroll_checkbox.checked = infiniscroll;

    scroll_label.addEventListener('click', (event) => {
        event.preventDefault()
        event.stopPropagation()

        let toggle = scroll_checkbox.checked;
        if (toggle) {
            scroll_checkbox.checked = false
            scroll_text.value = "false"
        } else {
            scroll_checkbox.checked = true
            scroll_text.value = "true"
        }
    })

    let search_container = document.querySelector('.search-container')!

    let fictions = search_container.querySelector('.fiction-list')!.children

    remove_fictions_under_min_chapter_limit(fictions, min_chapters)

    const first_navbar = document.querySelector('.search-container:last-child div.text-center')
    if (first_navbar) {
        first_navbar.setAttribute("style", "visibility: hidden; height: 0px");
    }

    function infiniteScrollingHandler() {
        const last_five_search_elements = document.querySelectorAll('.search-container:last-child div.row.fiction-list-item:nth-last-child(-n+5)')!

        const navbuttons = document.querySelector('.search-container:last-child > .text-center')! as HTMLElement

        return (isAnyInViewport(last_five_search_elements) || isElementInViewport(navbuttons)) && infiniscroll
    }


    let next_nav: HTMLLinkElement | null = null;
    let last_nav: HTMLLinkElement | null = null;
    let page_navs = document.querySelectorAll('.pagination > li')

    for(const element of page_navs) {
        if ((element.childNodes[0] as HTMLElement).innerText.startsWith('Next')) {
            next_nav = (element.childNodes[0] as HTMLLinkElement);
        }
        if ((element.childNodes[0] as HTMLElement).innerText.startsWith('Last')) {
            last_nav = (element.childNodes[0] as HTMLLinkElement)!;
        }
    };

    

    if (next_nav) {
        let next_page_link = next_nav.href;
        next_page_number = parseInt(new URL(next_page_link).searchParams.get('page')!, 10);
    } 
    if (last_nav) {
        let last_page_link = last_nav.href;
        last_page_number = parseInt(new URL(last_page_link).searchParams.get('page')!, 10);
    } 

    let base_link = window.location.href;
    let current_number = 0;

    onscroll = (event) => {
        if (window.location.pathname == '/fictions/search') {
            if (infiniteScrollingHandler() && next_page_number <= last_page_number && next_page_number > current_number) {
                current_number = next_page_number;
                let next_page_link = base_link + `&page=${next_page_number}`
                get_next_search_page(next_page_link, next_page_number, last_page_number);
            }
        }
    };

})();


