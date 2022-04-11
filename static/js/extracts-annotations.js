Extracts.targetTypeDefinitions.insertBefore(["ANNOTATION", "isAnnotatedLink", "has-annotation", "annotationForTarget", "annotation"], (def => def[0] == "LOCAL_PAGE")); Extracts = {
    ...Extracts, ...{
        annotatedTargetSelectors: ["a.docMetadata"], isAnnotatedLink: (target) => { return target.classList.contains("docMetadata"); }, annotationForTarget: (target) => {
            GWLog("Extracts.annotationForTarget", "extracts-annotations.js", 2); let annotationIdentifier = Extracts.targetIdentifier(target); if (Annotations.annotationForIdentifier(annotationIdentifier) == null) { Extracts.refreshPopFrameAfterAnnotationLoads(target); return `&nbsp;`; } else if (Annotations.annotationForIdentifier(annotationIdentifier) == "LOADING_FAILED") { target.popFrame.classList.add("loading-failed"); return `&nbsp;`; }
            let referenceData = Annotations.referenceDataForAnnotationIdentifier(annotationIdentifier); let linkTarget = (Extracts.popFrameProvider == Popins) ? "_self" : "_blank"; let originalLinkHTML = ""; if (referenceData.element.dataset.urlOriginal != undefined && referenceData.element.dataset.urlOriginal != target.href) {
                let originalURLText = referenceData.element.dataset.urlOriginal.includes("ar5iv") ? `<span class="smallcaps">HTML</span>` : "live"; originalLinkHTML = ` <span class="originalURL">[<a
                            title="Link to original URL for ${referenceData.element.textContent}"
                            href="${referenceData.element.dataset.urlOriginal}"
                            target="${linkTarget}"
                            alt="Original URL for this archived link; may be broken."
                                >`+ originalURLText + `</a>]</span>`;
            }
            let titleLinkClass = (originalLinkHTML > "" ? `title-link local-archive-link` : (Annotations.isWikipediaLink(annotationIdentifier) ? `title-link link-live` : `title-link`)); let titleLinkHTML = `<a
                                class="${titleLinkClass}"
                                title="Open ${target.href} in a new window"
                                href="${target.href}"
                                target="${linkTarget}"
                                    >${referenceData.titleHTML}</a>`; let similarLinksHtml = referenceData.similarHTML == `` ? `` : `; ${referenceData.similarHTML}`; let tagBacklinks = `${similarLinksHtml}</p>`; if (referenceData.tagsHTML == `` && referenceData.backlinksHTML == ``) { tagBacklinks = `${similarLinksHtml}</p>`; } else { if (referenceData.tagsHTML != `` && referenceData.backlinksHTML == ``) { tagBacklinks = `; <span class="data-field link-tags">${referenceData.tagsHTML}</span>${similarLinksHtml}</p>`; } else { if (referenceData.tagsHTML == `` && referenceData.backlinksHTML != ``) { tagBacklinks = `; ${referenceData.backlinksHTML}${similarLinksHtml}</p>`; } else { if (referenceData.tagsHTML != `` && referenceData.backlinksHTML != ``) { tagBacklinks = `; ${referenceData.tagsHTML}; ${referenceData.backlinksHTML}${similarLinksHtml}</p>`; } } } }
            let abstractSpecialClass = ``; if (Annotations.isWikipediaLink(annotationIdentifier))
                abstractSpecialClass = "wikipedia-entry"; return `<p class="data-field title">${titleLinkHTML}${originalLinkHTML}</p>`
                    + `<p class="data-field author-plus-date">${referenceData.authorHTML}${referenceData.dateHTML}`
                    + tagBacklinks
                    + `<div class="data-field annotation-abstract ${abstractSpecialClass}">${referenceData.abstractHTML}</div>`;
        }, titleForPopFrame_ANNOTATION: (popFrame) => {
            let target = popFrame.spawningTarget; let popFrameTitleText = Extracts.popFrameHasLoaded(popFrame) ? popFrame.querySelector(".data-field.title").textContent : (Annotations.isWikipediaLink(Extracts.targetIdentifier(target)) ? target.href : target.pathname + target.hash); if (target.hash > "" && (target.hostname == location.hostname && !(["adobe", "alibaba", "allen", "amazon", "baidu", "bytedance", "deepmind", "eleutherai", "elementai", "facebook", "flickr", "google", "googledeepmind", "huawei", "intel", "laion", "lighton", "microsoft", "microsoftnvidia", "miri", "nvidia", "openai", "pdf", "salesforce", "sensetime", "snapchat", "tencent", "tensorfork", "uber", "yandex"].includes(target.hash.substr(1))))) { popFrameTitleText = "&#x00a7; " + popFrameTitleText; } else if (target.hash > "" && Annotations.isWikipediaLink(Extracts.targetIdentifier(target)) && Extracts.popFrameHasLoaded(popFrame)) {
                popFrameTitleText = popFrameTitleText
                + " &#x00a7; "
                + popFrame.querySelector(target.hash).textContent;
            }
            if (target.dataset.urlOriginal) {
                let linkTarget = (Extracts.popFrameProvider == Popins) ? "_self" : "_blank"; return `[<a
                    class="popframe-title-link-archived"
                    title="Open ${target.href} in a new window (desktop) or current (mobile)"
                    href="${target.href}"
                    target="${linkTarget}"
                        >ARCHIVED</a>]`+
                    `<span class="separator">·</span>` +
                    `<a
                    class="popframe-title-link"
                    title="Open ${target.dataset.urlOriginal} in a new window (desktop) or current (mobile)"
                    href="${target.dataset.urlOriginal}"
                    target="${linkTarget}"
                        >${popFrameTitleText.replace(/^\[original\]/, "")}</a>`;
            } else { return Extracts.standardPopFrameTitleElementForTarget(target, popFrameTitleText); }
        }, preparePopup_ANNOTATION: (popup) => {
            let target = popup.spawningTarget; let targetAnalogueInLinkBibliography = document.querySelector(`a[id^='linkBibliography'][href='${target.href}']`); if (targetAnalogueInLinkBibliography) { let containingSection = targetAnalogueInLinkBibliography.closest("section"); if (containingSection && Popups.isVisible(containingSection)) { return null; } }
            return popup;
        }, rewritePopFrameContent_ANNOTATION: (popFrame) => {
            let target = popFrame.spawningTarget; if (popFrame.querySelector(".annotation-abstract").classList.contains("wikipedia-entry"))
                popFrame.contentView.classList.add("wikipedia-entry"); if (target.hostname == location.hostname)
                Extracts.qualifyLinksInPopFrame(popFrame); if (!(GW.mediaQueries.mobileWidth.matches)) {
                    let initialFigure = popFrame.querySelector(".annotation-abstract > figure.float-right:first-child"); if (initialFigure)
                        popFrame.contentView.insertBefore(initialFigure, popFrame.contentView.firstElementChild);
                }
            GW.notificationCenter.fireEvent("GW.contentDidLoad", { source: "Extracts.rewritePopFrameContent_ANNOTATION", document: popFrame.contentView, location: Extracts.locationForTarget(target), flags: GW.contentDidLoadEventFlags.needsRewrite }); if (target.hash > "") {
                requestAnimationFrame(() => {
                    let element = null; if (popFrame && (element = popFrame.querySelector(decodeURIComponent(target.hash))))
                        Extracts.popFrameProvider.scrollElementIntoViewInPopFrame(element);
                });
            }
        }, annotationLoadHoverDelay: 25, setUpAnnotationLoadEventWithin: (container) => {
            GWLog("Extracts.setUpAnnotationLoadEventWithin", "extracts-annotations.js", 1); let allAnnotatedTargetsInContainer = Array.from(container.querySelectorAll(Extracts.annotatedTargetSelectors.join(", "))); if (Extracts.popFrameProvider == Popups) {
                allAnnotatedTargetsInContainer.forEach(annotatedTarget => {
                    annotatedTarget.removeAnnotationLoadEvents = onEventAfterDelayDo(annotatedTarget, "mouseenter", Extracts.annotationLoadHoverDelay, (event) => {
                        let annotationIdentifier = Extracts.targetIdentifier(annotatedTarget); if (Annotations.cachedAnnotationExists(annotationIdentifier))
                            return; Annotations.loadAnnotation(annotationIdentifier);
                    }, "mouseleave");
                }); GW.notificationCenter.addHandlerForEvent("Extracts.cleanupDidComplete", () => { allAnnotatedTargetsInContainer.forEach(annotatedTarget => { annotatedTarget.removeAnnotationLoadEvents(); annotatedTarget.removeAnnotationLoadEvents = null; }); }, { once: true });
            } else {
                allAnnotatedTargetsInContainer.forEach(annotatedTarget => {
                    annotatedTarget.addEventListener("click", annotatedTarget.annotationLoad_click = (event) => {
                        let annotationIdentifier = Extracts.targetIdentifier(annotatedTarget); if (!Annotations.cachedAnnotationExists(annotationIdentifier))
                            Annotations.loadAnnotation(annotationIdentifier);
                    });
                }); GW.notificationCenter.addHandlerForEvent("Extracts.cleanupDidComplete", () => { allAnnotatedTargetsInContainer.forEach(annotatedTarget => { annotatedTarget.removeEventListener("click", annotatedTarget.annotationLoad_click); }); }, { once: true });
            }
        }, refreshPopFrameAfterAnnotationLoads: (target) => {
            GWLog("Extracts.refreshPopFrameAfterAnnotationLoads", "extracts-annotations.js", 2); target.popFrame.classList.toggle("loading", true); GW.notificationCenter.addHandlerForEvent("Annotations.annotationDidLoad", target.refreshPopFrameWhenFragmentLoaded = (info) => {
                GWLog("refreshPopFrameWhenFragmentLoaded", "extracts.js", 2); if (Extracts.popFrameProvider.isSpawned(target.popFrame) == false)
                    return; if (Extracts.popFrameProvider == Popups) { Popups.spawnPopup(target); } else if (Extracts.popFrameProvider == Popins) { Extracts.fillPopFrame(target.popin); target.popin.classList.toggle("loading", false); Extracts.rewritePopinContent(target.popin); requestAnimationFrame(() => { Popins.scrollPopinIntoView(target.popin); }); }
            }, { once: true, condition: (info) => info.identifier == Extracts.targetIdentifier(target) }); GW.notificationCenter.addHandlerForEvent("Annotations.annotationLoadDidFail", target.updatePopFrameWhenFragmentLoadFails = (info) => {
                GWLog("updatePopFrameWhenFragmentLoadFails", "extracts.js", 2); if (Extracts.popFrameProvider.isSpawned(target.popFrame) == false)
                    return; target.popFrame.swapClasses(["loading", "loading-failed"], 1);
            }, { once: true, condition: (info) => info.identifier == Extracts.targetIdentifier(target) });
        }
    }
};