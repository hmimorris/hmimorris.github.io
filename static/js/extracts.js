Extracts = {
	contentContainersSelector: ".markdownBody, #TOC, #page-metadata, #sidebar", targets: {
		targetElementsSelector: "a[href]", excludedElementsSelector: [".section-self-link", ".footnote-self-link", ".sidenote-self-link"].join(", "), excludedContainerElementsSelector: "h1, h2, h3, h4, h5, h6", testTarget: (target) => {
			let targetTypeInfo = Extracts.targetTypeInfo(target); if (targetTypeInfo) {
				let specialTestFunction = Extracts[`testTarget_${targetTypeInfo.typeName}`]
				if (specialTestFunction && specialTestFunction(target) == false)
					return false; let containingPopFrame = target.closest(".popframe"); if (containingPopFrame && Extracts.targetsMatch(containingPopFrame.spawningTarget, target))
					return false; if (targetTypeInfo.targetClasses)
					target.classList.add(...(targetTypeInfo.targetClasses.split(" "))); return true;
			}
			return false;
		}
	}, server404PageTitles: ["404 Not Found"], pageTitleRegexp: /^(.+?) · Gwern\.net$/, rootDocument: document.firstElementChild, popFrameProviderName: null, popFrameProvider: null, removeTargetsWithin: (container) => {
		GWLog("Extracts.removeTargetsWithin", "extracts.js", 1); let restoreTarget = (target) => {
			if (target.dataset.attributeTitle) { target.title = target.dataset.attributeTitle; target.removeAttribute("data-attribute-title"); }
			target.classList.remove("has-content", "has-annotation");
		}; Extracts.popFrameProvider.removeTargetsWithin(container, Extracts.targets, restoreTarget);
	}, cleanup: () => {
		GWLog("Extracts.cleanup", "extracts.js", 1); document.querySelectorAll(".has-content").forEach(link => { link.querySelector(".indicator-hook").remove(); }); document.querySelectorAll(Extracts.contentContainersSelector).forEach(container => { Extracts.removeTargetsWithin(container); });[Extracts.processTargetsOnContentLoad, Extracts.setUpAnnotationLoadEvent,].forEach(handler => GW.notificationCenter.removeHandlerForEvent("GW.contentDidLoad", handler)); if (Extracts.popFrameProvider == Popups) {
			if (Extracts.popupOptionsEnabled)
				Extracts.removePopupsDisabledShowPopupOptionsDialogButton();
		} else { }
		GW.notificationCenter.fireEvent("Extracts.cleanupDidComplete");
	}, addTargetsWithin: (container) => { GWLog("Extracts.addTargetsWithin", "extracts.js", 1); if (Extracts.popFrameProvider == Popups) { Popups.addTargetsWithin(container, Extracts.targets, Extracts.preparePopup, Extracts.preparePopupTarget); } else if (Extracts.popFrameProvider == Popins) { Popins.addTargetsWithin(container, Extracts.targets, Extracts.preparePopin); } }, setup: () => {
		GWLog("Extracts.setup", "extracts.js", 1); Extracts.popFrameProvider = window[Extracts.popFrameProviderName]; if (Extracts.popFrameProvider == Popups) {
			GWLog("Setting up for popups.", "extracts.js", 1); if (!Extracts.popupsEnabled()) {
				if (Extracts.popupOptionsEnabled) { Extracts.injectPopupsDisabledShowPopupOptionsDialogButton(); }
				return;
			}
			GWLog("Activating popups.", "extracts.js", 1);
		} else { GWLog("Setting up for popins.", "extracts.js", 1); GWLog("Activating popins.", "extracts.js", 1); }
		GW.notificationCenter.addHandlerForEvent("GW.contentDidLoad", Extracts.processTargetsOnContentLoad = (info) => { GWLog("Extracts.processTargetsOnContentLoad", "extracts.js", 2); Extracts.processTargetsInDocument(info.document, info.needsRewrite); GW.notificationCenter.fireEvent("Extracts.targetsDidProcessOnContentLoad", { source: "Extracts.processTargetsOnContentLoad", location: info.location, document: info.document, flags: info.flags }); }, { phase: "eventListeners" }); GW.notificationCenter.fireEvent("Extracts.setupDidComplete");
	}, processTargetsInDocument: (doc = Extracts.rootDocument, addHooks = true) => {
		GWLog("Extracts.processTargetsInDocument", "extracts.js", 2); if (doc.closest(Extracts.contentContainersSelector)) { Extracts.addTargetsWithin(doc); Extracts.setUpAnnotationLoadEventWithin(doc); } else { doc.querySelectorAll(Extracts.contentContainersSelector).forEach(container => { Extracts.addTargetsWithin(container); Extracts.setUpAnnotationLoadEventWithin(container); }); }
		if (addHooks) { doc.querySelectorAll(".has-content").forEach(link => { link.insertAdjacentHTML("afterbegin", `<span class='indicator-hook'></span>`); }); }
	}, targetTypeDefinitions: [["LOCAL_PAGE", "isLocalPageLink", "has-content", "localTranscludeForTarget", "local-transclude"],], targetTypeInfo: (target) => {
		let info = {}; for (definition of Extracts.targetTypeDefinitions) {
			[info.typeName, info.predicateFunctionName, info.targetClasses, info.popFrameFillFunctionName, info.popFrameClasses] = definition; if (Extracts[info.predicateFunctionName](target))
				return info;
		}
		return null;
	}, targetIdentifier: (target) => {
		if (target.dataset.urlOriginal) {
			let originalURL = new URL(target.dataset.urlOriginal); if (originalURL.hostname == "ar5iv.labs.arxiv.org") { originalURL.hostname = "arxiv.org"; originalURL.pathname = originalURL.pathname.replace("/html/", "/abs/"); originalURL.search = ""; }
			return originalURL.href;
		} else { return (target.hostname == location.hostname ? target.pathname + target.hash : target.href); }
	}, targetsMatch: (targetA, targetB) => { return Extracts.targetIdentifier(targetA) == Extracts.targetIdentifier(targetB) && Extracts.targetTypeInfo(targetA).typeName == Extracts.targetTypeInfo(targetB).typeName; }, qualifyLinksInPopFrame: (popFrame) => { popFrame.querySelectorAll("a[href^='#']").forEach(anchorLink => { anchorLink.pathname = popFrame.spawningTarget.pathname; }); }, nearestBlockElement: (element) => { return element.closest("section, .footnote, .sidenote, #markdownBody > *"); }, fillPopFrame: (popFrame) => {
		GWLog("Extracts.fillPopFrame", "extracts.js", 2); let didFill = false; let target = popFrame.spawningTarget; let targetTypeInfo = Extracts.targetTypeInfo(target); if (targetTypeInfo && targetTypeInfo.popFrameFillFunctionName) {
			didFill = Extracts.popFrameProvider.setPopFrameContent(popFrame, Extracts[targetTypeInfo.popFrameFillFunctionName](target)); if (targetTypeInfo.popFrameClasses)
				popFrame.classList.add(...(targetTypeInfo.popFrameClasses.split(" ")));
		}
		if (didFill) { return true; } else { GWLog(`Unable to fill pop-frame (${Extracts.targetIdentifier(target)} [${(targetTypeInfo ? targetTypeInfo.typeName : "UNDEFINED")}])!`, "extracts.js", 1); return false; }
	}, popFrameHasLoaded: (popFrame) => { return !(popFrame.classList.contains("loading") || popFrame.classList.contains("loading-failed")); }, standardPopFrameTitleElementForTarget: (target, titleText) => {
		if (typeof titleText == "undefined")
			titleText = (target.hostname == location.hostname) ? target.pathname + target.hash : target.href; let whichWindow = (Extracts.popFrameProvider == Popins) ? "current" : "new"; let linkTarget = (Extracts.popFrameProvider == Popins) ? "_self" : "_blank"; return `<a
            class="popframe-title-link"
            href="${target.href}"
            title="Open ${target.href} in ${whichWindow} window."
            target="${linkTarget}"
                >${titleText}</a>`;
	}, titleForPopFrame: (popFrame) => {
		let target = popFrame.spawningTarget; let targetTypeName = Extracts.targetTypeInfo(target).typeName; let specialTitleFunction = (Extracts.popFrameProvider == Popups ? Extracts[`titleForPopup_${targetTypeName}`] : Extracts[`titleForPopin_${targetTypeName}`]) || Extracts[`titleForPopFrame_${targetTypeName}`]; if (specialTitleFunction)
			return specialTitleFunction(popFrame); else
			return Extracts.standardPopFrameTitleElementForTarget(target);
	}, targetDocument: (target) => {
		if (target.hostname != location.hostname)
			return null; if (target.pathname == location.pathname)
			return Extracts.rootDocument; if (Extracts.popFrameProvider == Popups) { let popupForTargetDocument = Popups.allSpawnedPopups().find(popup => (popup.classList.contains("external-page-embed") && popup.spawningTarget.pathname == target.pathname)); return popupForTargetDocument ? popupForTargetDocument.contentView : null; } else if (Extracts.popFrameProvider == Popins) { let popinForTargetDocument = Popins.allSpawnedPopins().find(popin => (popin.classList.contains("external-page-embed") && popin.spawningTarget.pathname == target.pathname) && Extracts.popFrameHasLoaded(popin)); return popinForTargetDocument ? popinForTargetDocument.contentView : null; }
	}, locationForTarget: (target) => { return new URL(target.href); }, setLoadingSpinner: (popFrame) => {
		let target = popFrame.spawningTarget; popFrame.classList.toggle("loading", true); let objectOfSomeSort = popFrame.querySelector("iframe, object, img, video"); if (objectOfSomeSort.tagName == "IFRAME") { objectOfSomeSort.onload = (event) => { popFrame.classList.toggle("loading", false); if (target.hostname == location.hostname && Extracts.server404PageTitles.includes(objectOfSomeSort.contentDocument.title)) { popFrame.classList.toggle("loading-failed", true); } }; } else { objectOfSomeSort.onload = (event) => { popFrame.classList.toggle("loading", false); }; }
		objectOfSomeSort.onerror = (event) => { popFrame.swapClasses(["loading", "loading-failed"], 1); };
	}, isLocalPageLink: (target) => {
		if (target.hostname != location.hostname || Extracts.isAnnotatedLink(target))
			return false; if (target.pathname.match(/\./))
			return false; return (target.pathname != location.pathname || target.hash > "");
	}, localTranscludeForTarget: (target, unwrapFunction = ((blockElement) => { return (blockElement.tagName == "SECTION" ? blockElement.innerHTML : blockElement.outerHTML); })) => { GWLog("Extracts.localTranscludeForTarget", "extracts.js", 2); let fullTargetDocument = Extracts.targetDocument(target); if (fullTargetDocument && target.hash > "") { return unwrapFunction(Extracts.nearestBlockElement(fullTargetDocument.querySelector(decodeURIComponent(target.hash)))); } else { return Extracts.externalPageEmbedForTarget(target); } }, isTOCLink: (target) => { return (target.closest("#TOC") != null); }, isSidebarLink: (target) => { return (target.closest("#sidebar") != null); }, testTarget_LOCAL_PAGE: (target) => { return (!(Extracts.popFrameProvider == Popins && (Extracts.isTOCLink(target) || Extracts.isSidebarLink(target)))); }, preparePopup_LOCAL_PAGE: (popup) => {
		let target = popup.spawningTarget; if (Extracts.isTOCLink(target))
			popup.classList.add("toc-section"); return popup;
	}, titleForPopFrame_LOCAL_PAGE: (popFrame) => {
		let target = popFrame.spawningTarget; let popFrameTitleText; if (target.pathname == location.pathname) { let nearestBlockElement = Extracts.nearestBlockElement(document.querySelector(decodeURIComponent(target.hash))); popFrameTitleText = nearestBlockElement.tagName == "SECTION" ? nearestBlockElement.firstElementChild.textContent : target.hash; } else { if (popFrame.classList.contains("external-page-embed")) { popFrameTitleText = Extracts.cachedPageTitles[target.pathname] || target.pathname; } else { let targetDocument = Extracts.targetDocument(target); let nearestBlockElement = Extracts.nearestBlockElement(targetDocument.querySelector(decodeURIComponent(target.hash))); let pageTitleOrPath = Extracts.cachedPageTitles[target.pathname] || target.pathname; popFrameTitleText = nearestBlockElement.tagName == "SECTION" ? `${nearestBlockElement.firstElementChild.textContent} (${pageTitleOrPath})` : `${target.hash} (${pageTitleOrPath})`; } }
		if (target.hash > "" && !(popFrameTitleText.startsWith("#")) && !popFrame.classList.contains("external-page-embed"))
			popFrameTitleText = "&#x00a7; " + popFrameTitleText; return Extracts.standardPopFrameTitleElementForTarget(target, popFrameTitleText);
	}, rewritePopFrameContent_LOCAL_PAGE: (popFrame) => {
		let target = popFrame.spawningTarget; Extracts.qualifyLinksInPopFrame(target.popFrame); popFrame.querySelectorAll(".marginnote").forEach(marginNote => { marginNote.swapClasses(["inline", "sidenote"], 0); }); GW.notificationCenter.fireEvent("GW.contentDidLoad", { source: "Extracts.rewritePopFrameContent_LOCAL_PAGE", document: popFrame.contentView, location: Extracts.locationForTarget(target), flags: 0 }); if (target.hash > "" && popFrame.classList.contains("local-transclude"))
			requestAnimationFrame(() => {
				let element = null; if (popFrame && (element = popFrame.querySelector(decodeURIComponent(target.hash))))
					Extracts.popFrameProvider.scrollElementIntoViewInPopFrame(element);
			});
	}, rewritePopinContent_LOCAL_PAGE: (popin) => { Extracts.rewritePopFrameContent_LOCAL_PAGE(popin); let target = popin.spawningTarget; popin.querySelectorAll("a").forEach(link => { if (link.hostname == target.hostname && link.pathname == target.pathname && link.hash > "" && link.classList.contains("no-popin")) { link.onclick = () => { return false; }; link.addActivateEvent((event) => { let hashTarget = popin.querySelector(decodeURIComponent(link.hash)); if (hashTarget) { Popins.scrollElementIntoViewInPopFrame(hashTarget); return false; } else { return true; } }); } }); }, rewritePopupContent_LOCAL_PAGE: (popup) => {
		Extracts.rewritePopFrameContent_LOCAL_PAGE(popup); let target = popup.spawningTarget; if (Extracts.cachedPageThumbnailImageTags[target.pathname]) {
			let pageAbstract = popup.querySelector("#page-metadata + .abstract blockquote"); if (pageAbstract)
				pageAbstract.insertAdjacentHTML("afterbegin", `<figure>${Extracts.cachedPageThumbnailImageTags[target.pathname]}</figure>`);
		}
		popup.querySelectorAll("a").forEach(link => { if (link.hostname == target.hostname && link.pathname == target.pathname && link.hash > "") { link.onclick = () => { return false; }; link.addActivateEvent((event) => { let hashTarget = popup.querySelector(decodeURIComponent(link.hash)); if (hashTarget) { Popups.scrollElementIntoViewInPopFrame(hashTarget); return false; } else { return true; } }); } });
	}, cachedPages: {}, cachedPageTitles: {}, cachedPageThumbnailImageTags: {}, refreshPopFrameAfterLocalPageLoads: (target) => {
		GWLog("Extracts.refreshPopFrameAfterLocalPageLoads", "extracts.js", 2); target.popFrame.classList.toggle("loading", true); doAjax({
			location: target.href, onSuccess: (event) => {
				if (Extracts.popFrameProvider.isSpawned(target.popFrame) == false)
					return; Extracts.popFrameProvider.setPopFrameContent(target.popFrame, event.target.responseText); let pageThumbnailMetaTag = target.popFrame.querySelector("meta[property='og:image']"); if (pageThumbnailMetaTag) {
						let pageThumbnailURL = new URL(pageThumbnailMetaTag.getAttribute("content")); let pageThumbnailAltMetaTag = target.popFrame.querySelector("meta[property='og:image:alt']"); let pageThumbnailAltText = pageThumbnailAltMetaTag ? pageThumbnailAltMetaTag.getAttribute("content") : `Thumbnail image for “${Extracts.cachedPageTitles[target.pathname]}”`; let pageThumbnailWidth = target.popFrame.querySelector("meta[property='og:image:width']").getAttribute("content"); let pageThumbnailHeight = target.popFrame.querySelector("meta[property='og:image:height']").getAttribute("content"); if (pageThumbnailURL.pathname != "/static/img/logo/logo-whitebg-large-border.png")
							Extracts.cachedPageThumbnailImageTags[target.pathname] = `<img 
							src='${pageThumbnailURL.href}' 
							alt='${pageThumbnailAltText}'
							width='${pageThumbnailWidth}' 
							height='${pageThumbnailHeight}' 
							style='width: ${pageThumbnailWidth}px; height: auto;'
								>`; doAjax({ location: pageThumbnailURL.href });
					}
				Extracts.cachedPageTitles[target.pathname] = target.popFrame.querySelector("title").innerHTML.match(Extracts.pageTitleRegexp)[1]; Extracts.cachedPages[target.pathname] = target.popFrame.querySelector("#markdownBody"); let pageMetadata = target.popFrame.querySelector("#page-metadata"); if (pageMetadata)
					Extracts.cachedPages[target.pathname].insertBefore(pageMetadata, Extracts.cachedPages[target.pathname].firstElementChild); GW.notificationCenter.fireEvent("GW.contentDidLoad", { source: "Extracts.refreshPopFrameAfterLocalPageLoads", document: target.popFrame.contentView, location: Extracts.locationForTarget(target), flags: (GW.contentDidLoadEventFlags.needsRewrite | GW.contentDidLoadEventFlags.isFullPage) }); if (Extracts.popFrameProvider == Popups) { Popups.spawnPopup(target); } else if (Extracts.popFrameProvider == Popins) { Extracts.fillPopFrame(target.popin); target.popin.classList.toggle("loading", false); Extracts.rewritePopinContent(target.popin); requestAnimationFrame(() => { Popins.scrollPopinIntoView(target.popin); }); }
			}, onFailure: (event) => {
				if (Extracts.popFrameProvider.isSpawned(target.popFrame) == false)
					return; target.popFrame.swapClasses(["loading", "loading-failed"], 1);
			}
		});
	}, externalPageEmbedForTarget: (target) => { GWLog("Extracts.externalPageEmbedForTarget", "extracts.js", 2); target.popFrame.classList.add("external-page-embed"); if (Extracts.cachedPages[target.pathname]) { target.popFrame.classList.toggle("external-page-embed", "page-" + target.pathname.substr(1), true); return Extracts.cachedPages[target.pathname].innerHTML; } else { Extracts.refreshPopFrameAfterLocalPageLoads(target); return `&nbsp;`; } }, preparePopFrame: (popFrame) => {
		GWLog("Extracts.preparePopFrame", "extracts.js", 2); let target = popFrame.spawningTarget; popFrame.classList.add(...target.classList); popFrame.classList.remove("has-annotation", "has-content", "link-self", "link-local", "spawns-popup", "spawns-popin", "idNot", "backlinksNot", "uri"); popFrame.contentView.classList.add("markdownBody"); if (Extracts.fillPopFrame(popFrame) == false)
			return null; return popFrame;
	}, preparePopin: (popin) => {
		GWLog("Extracts.preparePopin", "extracts.js", 2); let target = popin.spawningTarget; if ((popin = Extracts.preparePopFrame(popin)) == null)
			return null; let popinTitle = Extracts.titleForPopFrame(popin); if (popinTitle) {
				popin.titleBarContents = [`<span class="popframe-title">${popinTitle}</span>`, Popins.titleBarComponents.closeButton()]; if (Extracts.popinOptionsEnabled)
					popup.titleBarContents.push(Extracts.showPopinOptionsDialogPopinTitleBarButton());
			}
		let targetTypeName = Extracts.targetTypeInfo(target).typeName; let specialPrepareFunction = Extracts[`preparePopin_${targetTypeName}`] || Extracts[`preparePopFrame_${targetTypeName}`]; if (specialPrepareFunction)
			if ((popin = specialPrepareFunction(popin)) == null)
				return null; if (Extracts.popFrameHasLoaded(popin))
			Extracts.rewritePopinContent(popin); return popin;
	}, rewritePopinContent: (popin) => {
		GWLog("Extracts.rewritePopinContent", "extracts.js", 2); let target = popin.spawningTarget; if (popin.titleBar)
			popin.titleBar.querySelector(".popframe-title").innerHTML = Extracts.titleForPopFrame(popin); let targetTypeName = Extracts.targetTypeInfo(target).typeName; let specialRewriteFunction = Extracts[`rewritePopinContent_${targetTypeName}`] || Extracts[`rewritePopFrameContent_${targetTypeName}`]; if (specialRewriteFunction)
			specialRewriteFunction(popin); let objectOfSomeSort = popin.querySelector("iframe, object, img, video"); if (objectOfSomeSort) { objectOfSomeSort.addEventListener("load", (event) => { requestAnimationFrame(() => { Popins.scrollPopinIntoView(popin); }); }); }
	}, popupsEnabled: () => { return (localStorage.getItem("extract-popups-disabled") != "true"); }, spawnedPopupMatchingTarget: (target) => { return Popups.allSpawnedPopups().find(popup => Extracts.targetsMatch(target, popup.spawningTarget) && Popups.popupIsEphemeral(popup)); }, preparePopupTarget: (target) => {
		if (target.title) { target.dataset.attributeTitle = target.title; target.removeAttribute("title"); }
		target.preferSidePositioning = () => { return (target.closest("#sidebar, li") != null && target.closest(".columns") == null); };
	}, preparePopup: (popup) => {
		GWLog("Extracts.preparePopup", "extracts.js", 2); let target = popup.spawningTarget; let existingPopup = Extracts.spawnedPopupMatchingTarget(target); if (existingPopup) { Popups.detachPopupFromTarget(existingPopup); existingPopup.spawningTarget = target; return existingPopup; }
		if ((popup = Extracts.preparePopFrame(popup)) == null)
			return null; let popupTitle = Extracts.titleForPopFrame(popup); if (popupTitle) {
				popup.titleBarContents = [Popups.titleBarComponents.closeButton(), Popups.titleBarComponents.zoomButton().enableSubmenu(), Popups.titleBarComponents.pinButton(), `<span class="popframe-title">${popupTitle}</span>`]; if (Extracts.popupOptionsEnabled)
					popup.titleBarContents.push(Extracts.showPopupOptionsDialogPopupTitleBarButton());
			}
		let targetTypeName = Extracts.targetTypeInfo(target).typeName; let specialPrepareFunction = Extracts[`preparePopup_${targetTypeName}`] || Extracts[`preparePopFrame_${targetTypeName}`]; if (specialPrepareFunction)
			if ((popup = specialPrepareFunction(popup)) == null)
				return null; if (Extracts.popFrameHasLoaded(popup))
			Extracts.rewritePopupContent(popup); return popup;
	}, rewritePopupContent: (popup) => {
		GWLog("Extracts.rewritePopupContent", "extracts.js", 2); let target = popup.spawningTarget; let targetTypeName = Extracts.targetTypeInfo(target).typeName; let specialRewriteFunction = Extracts[`rewritePopupContent_${targetTypeName}`] || Extracts[`rewritePopFrameContent_${targetTypeName}`]; if (specialRewriteFunction)
			specialRewriteFunction(popup); popup.querySelectorAll("figure[class^='float-'] img[width]").forEach(img => { if (img.style.width <= "") { img.style.width = img.getAttribute("width") + "px"; img.style.maxHeight = "unset"; } });
	}
}; GW.notificationCenter.fireEvent("Extracts.didLoad"); let mobileMode = (localStorage.getItem("extracts-force-popins") == "true") || GW.isMobile(); Extracts.popFrameProviderName = mobileMode ? "Popins" : "Popups"; GWLog(`${(mobileMode ? "Mobile" : "Non-mobile")} client detected. Activating ${(mobileMode ? "popins" : "popups")}.`, "extracts.js", 1); doSetup = () => { Popups = window["Popups"] || {}; Popins = window["Popins"] || {}; Extracts.setup(); }; if (window[Extracts.popFrameProviderName]) { doSetup(); } else { GW.notificationCenter.addHandlerForEvent(Extracts.popFrameProviderName + ".didLoad", () => { doSetup(); }, { once: true }); }