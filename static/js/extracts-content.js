Extracts.targetTypeDefinitions.insertBefore(["AUX_LINKS_LINK", "isAuxLinksLink", "has-content", "auxLinksForTarget", "aux-links"], (def => def[0] == "LOCAL_PAGE")); Extracts = {
    ...Extracts, ...{
        auxLinksCache: {}, auxLinksLinkType: (target) => {
            if (target.pathname.startsWith("/metadata/annotations/") == false)
                return null; return /^\/metadata\/annotations\/([^\/]+)/.exec(target.pathname)[1];
        }, isAuxLinksLink: (target) => { let auxLinksLinkType = Extracts.auxLinksLinkType(target); return (auxLinksLinkType && target.classList.contains(auxLinksLinkType)); }, auxLinksForTarget: (target) => { GWLog("Extracts.auxLinksForTarget", "extracts-content.js", 2); if (Extracts.auxLinksCache[target.pathname]) { return Extracts.auxLinksCache[target.pathname].innerHTML; } else { Extracts.refreshPopFrameAfterAuxLinksLoad(target); return `&nbsp;`; } }, rewritePopFrameContent_AUX_LINKS_LINK: (popFrame) => { let target = popFrame.spawningTarget; GW.notificationCenter.fireEvent("GW.contentDidLoad", { source: "Extracts.rewritePopFrameContent_AUX_LINKS_LINK", document: popFrame.contentView, location: Extracts.locationForTarget(target), flags: 0 }); }, targetOfAuxLinksLink: (target) => { return decodeURIComponent(decodeURIComponent(/\/metadata\/annotations\/[^\/]+?\/(.+?)\.html$/.exec(target.pathname)[1])); }, titleForPopFrame_AUX_LINKS_LINK: (popFrame) => { let target = popFrame.spawningTarget; let targetPage = Extracts.targetOfAuxLinksLink(target); let auxLinksLinkType = Extracts.auxLinksLinkType(target); switch (auxLinksLinkType) { case "backlinks": return `${targetPage} (Backlinks)`; case "similars": return `${targetPage} (Similar)`; default: return `${targetPage}`; } }, refreshPopFrameAfterAuxLinksLoad: (target) => {
            GWLog("Extracts.refreshPopFrameAfterAuxLinksLoad", "extracts-content.js", 2); target.popFrame.classList.toggle("loading", true); doAjax({
                location: target.href, onSuccess: (event) => {
                    if (Extracts.popFrameProvider.isSpawned(target.popFrame) == false)
                        return; Extracts.popFrameProvider.setPopFrameContent(target.popFrame, event.target.responseText); Extracts.auxLinksCache[target.pathname] = target.popFrame.contentView; GW.notificationCenter.fireEvent("GW.contentDidLoad", { source: "Extracts.refreshPopFrameAfterAuxLinksLoad", document: target.popFrame.contentView, location: Extracts.locationForTarget(target), flags: GW.contentDidLoadEventFlags.needsRewrite }); if (Extracts.popFrameProvider == Popups) { Popups.spawnPopup(target); } else if (Extracts.popFrameProvider == Popins) { Extracts.fillPopFrame(target.popin); target.popin.classList.toggle("loading", false); Extracts.rewritePopinContent(target.popin); requestAnimationFrame(() => { Popins.scrollPopinIntoView(target.popin); }); }
                }, onFailure: (event) => {
                    if (Extracts.popFrameProvider.isSpawned(target.popFrame) == false)
                        return; target.popFrame.swapClasses(["loading", "loading-failed"], 1);
                }
            });
        }
    }
}; Extracts.targetTypeDefinitions.insertBefore(["CITATION", "isCitation", null, "citationForTarget", "footnote"], (def => def[0] == "LOCAL_PAGE")); Extracts = {
    ...Extracts, ...{
        isCitation: (target) => { return target.classList.contains("footnote-ref"); }, citationForTarget: (target) => { GWLog("Extracts.citationForTarget", "extracts-content.js", 2); return Extracts.localTranscludeForTarget(target, (blockElement) => { return target.hash.startsWith("#sn") ? blockElement.querySelector(".sidenote-inner-wrapper").innerHTML : blockElement.innerHTML; }); }, titleForPopFrame_CITATION: (popFrame) => { let target = popFrame.spawningTarget; let footnoteNumber = target.querySelector("sup").textContent; let popFrameTitleText = `Footnote #${footnoteNumber}`; return Extracts.standardPopFrameTitleElementForTarget(target, popFrameTitleText); }, preparePopup_CITATION: (popup) => {
            let target = popup.spawningTarget; if (Array.from(allNotesForCitation(target)).findIndex(note => Popups.isVisible(note)) != -1)
                return null; popup.classList.add("mini-title-bar"); popup.addEventListener("mouseenter", (event) => { target.classList.toggle("highlighted", true); }); popup.addEventListener("mouseleave", (event) => { target.classList.toggle("highlighted", false); }); GW.notificationCenter.addHandlerForEvent("Popups.popupWillDespawn", Extracts.footnotePopupDespawnHandler = (info) => { target.classList.toggle("highlighted", false); }); return popup;
        }, rewritePopFrameContent_CITATION: (popFrame) => { let target = popFrame.spawningTarget; GW.notificationCenter.fireEvent("GW.contentDidLoad", { source: "Extracts.rewritePopFrameContent_CITATION", document: popFrame.contentView, location: Extracts.locationForTarget(target), flags: 0 }); },
    }
}; Extracts.targetTypeDefinitions.insertBefore(["CITATION_BACK_LINK", "isCitationBackLink", null, "citationBackLinkForTarget", "citation-context"], (def => def[0] == "LOCAL_PAGE")); Extracts = {
    ...Extracts, ...{
        isCitationBackLink: (target) => { return target.classList.contains("footnote-back"); }, citationBackLinkForTarget: (target) => { GWLog("Extracts.citationBackLinkForTarget", "extracts-content.js", 2); return Extracts.localTranscludeForTarget(target); }, testTarget_CITATION_BACK_LINK: (target) => { return (Extracts.popFrameProvider != Popins); }, preparePopup_CITATION_BACK_LINK: (popup) => {
            let target = popup.spawningTarget; if (Popups.isVisible(Extracts.targetDocument(target).querySelector(decodeURIComponent(target.hash))))
                return null; popup.classList.add("mini-title-bar"); return popup;
        }, rewritePopupContent_CITATION_BACK_LINK: (popup) => { let target = popup.spawningTarget; popup.querySelectorAll(".footnote-ref.targeted").forEach(targetedCitation => { targetedCitation.classList.remove("targeted"); }); let citationInPopup = popup.querySelector(decodeURIComponent(target.hash)); citationInPopup.classList.add("targeted"); requestAnimationFrame(() => { Extracts.popFrameProvider.scrollElementIntoViewInPopFrame(citationInPopup, popup); }); GW.notificationCenter.fireEvent("GW.contentDidLoad", { source: "Extracts.rewritePopupContent_CITATION_BACK_LINK", document: popup.contentView, location: Extracts.locationForTarget(target), flags: 0 }); }
    }
}; Extracts.targetTypeDefinitions.insertBefore(["VIDEO", "isVideoLink", "has-content", "videoForTarget", "video object"], (def => def[0] == "LOCAL_PAGE")); Extracts = {
    ...Extracts, ...{
        youtubeId: (href) => { let match = href.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/); if (match && match[2].length == 11) { return match[2]; } else { return null; } }, isVideoLink: (target) => {
            if (Extracts.isAnnotatedLink(target))
                return false; if (["www.youtube.com", "youtube.com", "youtu.be"].includes(target.hostname)) { return (Extracts.youtubeId(target.href) != null); } else { return false; }
        }, videoForTarget: (target) => {
            GWLog("Extracts.videoForTarget", "extracts-content.js", 2); let videoId = Extracts.youtubeId(target.href); let videoEmbedURL = `https://www.youtube.com/embed/${videoId}`; let placeholderImgSrc = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`; let srcdocStyles = `<style>` +
                `* { padding: 0; margin: 0; overflow: hidden; }` +
                `html, body { height: 100%; } ` +
                `img, span { position: absolute; width: 100%; top: 0; bottom: 0; margin: auto; } ` +
                `span { height: 1.5em; text-align: center; font: 48px/1.5 sans-serif; color: white; text-shadow: 0 0 0.5em black; }` +
                `</style>`; let playButtonHTML = `<span class='video-embed-play-button'>&#x25BA;</span>`; let srcdocHTML = `<a href='${videoEmbedURL}?autoplay=1'><img src='${placeholderImgSrc}'>${playButtonHTML}</a>`; return `<iframe src="${videoEmbedURL}" srcdoc="${srcdocStyles}${srcdocHTML}" frameborder="0" allowfullscreen sandbox="allow-scripts allow-same-origin"></iframe>`;
        }
    }
}; Extracts.targetTypeDefinitions.insertBefore(["LOCAL_VIDEO", "isLocalVideoLink", "has-content", "localVideoForTarget", "video object"], (def => def[0] == "LOCAL_PAGE")); Extracts = {
    ...Extracts, ...{
        videoFileExtensions: ["mp4"], isLocalVideoLink: (target) => {
            if (target.hostname != location.hostname || Extracts.isAnnotatedLink(target))
                return false; let videoFileURLRegExp = new RegExp('('
                    + Extracts.videoFileExtensions.map(ext => `\\.${ext}`).join("|")
                    + ')$', 'i'); return (target.pathname.match(videoFileURLRegExp) != null);
        }, localVideoForTarget: (target) => {
            GWLog("Extracts.localVideoForTarget", "extracts-content.js", 2); return `<video controls="controls" preload="none">` +
                `<source src="${target.href}">` +
                `</video>`;
        }, preparePopup_LOCAL_VIDEO: (popup) => { popup.classList.add("mini-title-bar"); return popup; }, rewritePopFrameContent_LOCAL_VIDEO: (popFrame) => { Extracts.setLoadingSpinner(popFrame); }
    }
}; Extracts.targetTypeDefinitions.insertBefore(["LOCAL_IMAGE", "isLocalImageLink", "has-content", "localImageForTarget", "image object"], (def => def[0] == "LOCAL_PAGE")); Extracts = {
    ...Extracts, ...{
        imageFileExtensions: ["bmp", "gif", "ico", "jpeg", "jpg", "png", "svg"], imageMaxWidth: 634.0, imageMaxHeight: 474.0, isLocalImageLink: (target) => {
            if (target.hostname != location.hostname || Extracts.isAnnotatedLink(target))
                return false; let imageFileURLRegExp = new RegExp('('
                    + Extracts.imageFileExtensions.map(ext => `\\.${ext}`).join("|")
                    + ')$', 'i'); return (target.pathname.match(imageFileURLRegExp) != null);
        }, localImageForTarget: (target) => {
            GWLog("Extracts.localImageForTarget", "extracts-content.js", 2); let width = target.dataset.imageWidth || 0; let height = target.dataset.imageHeight || 0; if (width > Extracts.imageMaxWidth) { height *= Extracts.imageMaxWidth / width; width = Extracts.imageMaxWidth; }
            if (height > Extracts.imageMaxHeight) { width *= Extracts.imageMaxHeight / height; height = Extracts.imageMaxHeight; }
            let styles = ``; if (width > 0 && height > 0)
                styles = `width="${width}" height="${height}" style="width: ${width}px; height: ${height}px;"`; return `<img ${styles} class="${target.classList}" src="${target.href}" loading="lazy">`;
        }, preparePopup_LOCAL_IMAGE: (popup) => { popup.classList.add("mini-title-bar"); return popup; }, rewritePopFrameContent_LOCAL_IMAGE: (popFrame) => { popFrame.querySelector("img").classList.remove("has-annotation", "has-content", "link-self", "link-local"); Extracts.setLoadingSpinner(popFrame); }, rewritePopinContent_LOCAL_IMAGE: (popin) => { Extracts.rewritePopFrameContent_LOCAL_IMAGE(popin); popin.querySelector("img").classList.remove("spawns-popin"); }, rewritePopupContent_LOCAL_IMAGE: (popup) => {
            Extracts.rewritePopFrameContent_LOCAL_IMAGE(popup); popup.querySelector("img").classList.remove("spawns-popup"); if (popup.querySelector("img[width][height]"))
                popup.classList.add("dimensions-specified");
        },
    }
}; Extracts.targetTypeDefinitions.insertBefore(["LOCAL_DOCUMENT", "isLocalDocumentLink", "has-content", "localDocumentForTarget", "local-document object"], (def => def[0] == "LOCAL_PAGE")); Extracts = {
    ...Extracts, ...{
        isLocalDocumentLink: (target) => {
            if (target.hostname != location.hostname || Extracts.isAnnotatedLink(target))
                return false; return (target.pathname.startsWith("/docs/www/") || (target.pathname.startsWith("/docs/") && target.pathname.match(/\.(html|pdf)$/i) != null));
        }, localDocumentForTarget: (target) => { GWLog("Extracts.localDocumentForTarget", "extracts-content.js", 2); if (target.href.match(/\.pdf(#|$)/) != null) { let data = target.href + (target.href.includes("#") ? "&" : "#") + "view=FitH"; return `<object data="${data}"></object>`; } else { return `<iframe src="${target.href}" frameborder="0" sandbox="allow-same-origin" referrerpolicy="same-origin"></iframe>`; } }, testTarget_LOCAL_DOCUMENT: (target) => { return (!(Extracts.popFrameProvider == Popins && target.href.match(/\.pdf(#|$)/) != null)); }, rewritePopFrameContent_LOCAL_DOCUMENT: (popFrame) => {
            let iframe = popFrame.querySelector("iframe"); if (iframe) { iframe.addEventListener("load", (event) => { popFrame.titleBar.querySelector(".popframe-title-link").innerHTML = iframe.contentDocument.title; }); }
            Extracts.setLoadingSpinner(popFrame);
        }
    }
}; Extracts.targetTypeDefinitions.insertBefore(["LOCAL_CODE_FILE", "isLocalCodeFileLink", "has-content", "localCodeFileForTarget", "local-code-file"], (def => def[0] == "LOCAL_PAGE")); Extracts = {
    ...Extracts, ...{
        codeFileExtensions: ["bash", "c", "conf", "css", "csv", "diff", "hs", "html", "js", "json", "jsonl", "opml", "page", "patch", "php", "py", "R", "sh", "xml", "yaml", "txt"], isLocalCodeFileLink: (target) => {
            if (target.hostname != location.hostname || Extracts.isAnnotatedLink(target))
                return false; if (Extracts.isAuxLinksLink(target))
                return false; let codeFileURLRegExp = new RegExp('('
                    + Extracts.codeFileExtensions.map(ext => `\\.${ext}`).join("|")
                    + ')$', 'i'); return (target.pathname.match(codeFileURLRegExp) != null);
        }, localCodeFileForTarget: (target) => {
            GWLog("Extracts.localCodeFileForTarget", "extracts-content.js", 2); let setPopFrameContent = Extracts.popFrameProvider.setPopFrameContent; target.popFrame.classList.toggle("loading", true); doAjax({
                location: target.href + ".html", onSuccess: (event) => {
                    if (!target.popFrame)
                        return; target.popFrame.classList.toggle("loading", false); setPopFrameContent(target.popFrame, event.target.responseText); if (Extracts.popFrameProvider == Popups)
                        Extracts.rewritePopupContent(target.popup); else
                        Extracts.rewritePopinContent(target.popin);
                }, onFailure: (event) => {
                    doAjax({
                        location: target.href, onSuccess: (event) => {
                            if (!target.popFrame)
                                return; target.popFrame.classList.toggle("loading", false); let htmlEncodedResponse = event.target.responseText.replace(/[<>]/g, c => ('&#' + c.charCodeAt(0) + ';')); let lines = htmlEncodedResponse.split("\n"); htmlEncodedResponse = lines.map(line => `<span class="line">${(line || "&nbsp;")}</span>`).join("\n"); setPopFrameContent(target.popFrame, `<pre class="raw-code"><code>${htmlEncodedResponse}</code></pre>`); if (Extracts.popFrameProvider == Popups)
                                Extracts.rewritePopupContent(target.popup); else
                                Extracts.rewritePopinContent(target.popin);
                        }, onFailure: (event) => {
                            if (!target.popFrame)
                                return; target.popFrame.swapClasses(["loading", "loading-failed"], 1);
                        }
                    });
                }
            }); return `&nbsp;`;
        },
    }
}; Extracts.targetTypeDefinitions.insertBefore(["FOREIGN_SITE", "isForeignSiteLink", "has-content", "foreignSiteForTarget", "foreign-site object"], (def => def[0] == "LOCAL_PAGE")); Extracts = {
    ...Extracts, ...{
        isForeignSiteLink: (target) => {
            if (target.hostname == location.hostname || Extracts.isAnnotatedLink(target))
                return false; return target.classList.contains("link-live");
        }, foreignSiteForTarget: (target) => {
            GWLog("Extracts.foreignSiteForTarget", "extracts-content.js", 2); let url = new URL(target.href); if (localStorage.getItem("enable-embed-proxy") == "true") {
                let proxyURL = new URL("https://api.obormot.net/embed.php"); doAjax({
                    location: proxyURL.href, params: { url: url.href }, onSuccess: (event) => {
                        if (!target.popFrame)
                            return; let doc = document.createElement("div"); doc.innerHTML = event.target.responseText; doc.querySelectorAll("[href], [src]").forEach(element => { if (element.href) { let elementURL = new URL(element.href); if (elementURL.host == location.host && !element.getAttribute("href").startsWith("#")) { elementURL.host = url.host; element.href = elementURL.href; } } else if (element.src) { let elementURL = new URL(element.src); if (elementURL.host == location.host) { elementURL.host = url.host; element.src = elementURL.href; } } }); if (event.target.getResponseHeader("content-type").startsWith("text/plain"))
                            doc.innerHTML = `<pre>${doc.innerHTML}</pre>`; target.popFrame.querySelector("iframe").srcdoc = doc.innerHTML; target.popFrame.classList.toggle("loading", false);
                    }, onFailure: (event) => {
                        if (!target.popFrame)
                            return; target.popFrame.swapClasses(["loading", "loading-failed"], 1);
                    }
                }); return `<iframe frameborder="0" sandbox="allow-scripts allow-popups"></iframe>`;
            }
            if (["www.lesswrong.com", "lesswrong.com", "www.greaterwrong.com", "greaterwrong.com"].includes(url.hostname)) { url.protocol = "https:"; url.hostname = "www.greaterwrong.com"; url.search = "format=preview&theme=classic"; } else if (["www.alignmentforum.org", "alignmentforum.org"].includes(url.hostname) || (["www.greaterwrong.com", "greaterwrong.com"].includes(url.hostname) && url.searchParams.get("view") == "alignment-forum")) { url.protocol = "https:"; url.hostname = "www.greaterwrong.com"; url.search = "view=alignment-forum&format=preview&theme=classic"; } else if (["forum.effectivealtruism.org", "ea.greaterwrong.com"].includes(url.hostname)) { url.protocol = "https:"; url.hostname = "ea.greaterwrong.com"; url.search = "format=preview&theme=classic"; } else if (["arbital.com", "arbital.greaterwrong.com"].includes(url.hostname)) { url.protocol = "https:"; url.hostname = "arbital.greaterwrong.com"; url.search = "format=preview&theme=classic"; } else if (/(.+?)\.wikipedia\.org/.test(url.hostname) == true) {
                url.protocol = "https:"; url.hostname = url.hostname.replace(/(.+?)(?:\.m)?\.wikipedia\.org/, "$1.m.wikipedia.org"); if (!url.hash)
                    url.hash = "#bodyContent";
            } else { url.protocol = "https:"; }
            return `<iframe src="${url.href}" frameborder="0" sandbox></iframe>`;
        }, rewritePopFrameContent_FOREIGN_SITE: (popFrame) => { Extracts.setLoadingSpinner(popFrame); }
    }
};