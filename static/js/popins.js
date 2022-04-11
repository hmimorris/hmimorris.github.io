Popins = {
    rootDocument: document.firstElementChild, cleanup: () => { GWLog("Popins.cleanup", "popins.js", 1); Popins.allSpawnedPopins().forEach(popin => { Popins.removePopin(popin); }); }, setup: () => { GWLog("Popins.setup", "popins.js", 1); Popins.cleanup(); GW.notificationCenter.fireEvent("Popins.setupDidComplete"); }, addTargetsWithin: (contentContainer, targets, prepareFunction, targetPrepareFunction = null) => {
        if (typeof contentContainer == "string")
            contentContainer = document.querySelector(contentContainer); if (contentContainer == null)
            return; contentContainer.querySelectorAll(targets.targetElementsSelector).forEach(target => {
                if (target.closest(targets.excludedElementsSelector) == target || target.closest(targets.excludedContainerElementsSelector) != null) { target.classList.toggle("no-popin", true); return; }
                if (!targets.testTarget(target)) { target.classList.toggle("no-popin", true); return; }
                target.onclick = Popins.targetClicked; target.preparePopin = prepareFunction; if (targetPrepareFunction)
                    targetPrepareFunction(target); target.classList.toggle("spawns-popin", true);
            });
    }, removeTargetsWithin: (contentContainer, targets, targetRestoreFunction = null) => {
        if (typeof contentContainer == "string")
            contentContainer = document.querySelector(contentContainer); if (contentContainer == null)
            return; contentContainer.querySelectorAll(targets.targetElementsSelector).forEach(target => {
                if (target.closest(targets.excludedElementsSelector) == target || target.closest(targets.excludedContainerElementsSelector) != null) { target.classList.toggle("no-popin", false); return; }
                if (!targets.testTarget(target)) { target.classList.toggle("no-popin", false); return; }
                target.onclick = null; if (target.popin)
                    Popins.removePopin(target.popin); target.preparePopin = null; target.classList.toggle("spawns-popin", false); if (targetRestoreFunction)
                    targetRestoreFunction(target);
            });
    }, scrollElementIntoViewInPopFrame: (element) => { let popin = element.closest(".popin"); popin.scrollView.scrollTop = element.getBoundingClientRect().top - popin.contentView.getBoundingClientRect().top; }, containingDocumentForTarget: (target) => { let containingPopin = target.closest(".popin"); return (containingPopin ? containingPopin.contentView : Popins.rootDocument); }, allSpawnedPopins: () => { return Array.from(document.querySelectorAll(".popin")); }, popinStackNumber: (popin) => {
        let popinBelow = (popin.nextElementSibling && popin.nextElementSibling.classList.contains("popin")) ? popin.nextElementSibling : null; if (popinBelow)
            return parseInt(popinBelow.titleBar.stackCounter.textContent) + 1; else
            return 1;
    }, addTitleBarToPopin: (popin) => {
        popin.classList.add("has-title-bar"); popin.titleBar = document.createElement("div"); popin.titleBar.classList.add("popframe-title-bar"); popin.insertBefore(popin.titleBar, popin.firstElementChild); popin.titleBar.stackCounter = document.createElement("span"); popin.titleBar.stackCounter.classList.add("popin-stack-counter"); requestAnimationFrame(() => {
            let popinStackNumber = Popins.popinStackNumber(popin); popin.titleBar.stackCounter.textContent = popinStackNumber; if (popinStackNumber == 1)
                popin.titleBar.stackCounter.style.display = "none";
        }); popin.titleBar.appendChild(popin.titleBar.stackCounter); popin.titleBarContents.forEach(elementOrHTML => {
            if (typeof elementOrHTML == "string") { popin.titleBar.insertAdjacentHTML("beforeend", elementOrHTML); } else { popin.titleBar.appendChild(elementOrHTML); }
            let newlyAddedElement = popin.titleBar.lastElementChild; if (newlyAddedElement.buttonAction)
                newlyAddedElement.addActivateEvent(newlyAddedElement.buttonAction);
        });
    }, titleBarComponents: { genericButton: () => { let button = document.createElement("BUTTON"); button.classList.add("popframe-title-bar-button"); button.buttonAction = (event) => { event.stopPropagation(); }; return button; }, closeButton: () => { let button = Popins.titleBarComponents.genericButton(); button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path d="M193.94 256L296.5 153.44l21.15-21.15c3.12-3.12 3.12-8.19 0-11.31l-22.63-22.63c-3.12-3.12-8.19-3.12-11.31 0L160 222.06 36.29 98.34c-3.12-3.12-8.19-3.12-11.31 0L2.34 120.97c-3.12 3.12-3.12 8.19 0 11.31L126.06 256 2.34 379.71c-3.12 3.12-3.12 8.19 0 11.31l22.63 22.63c3.12 3.12 8.19 3.12 11.31 0L160 289.94 262.56 392.5l21.15 21.15c3.12 3.12 8.19 3.12 11.31 0l22.63-22.63c3.12-3.12 3.12-8.19 0-11.31L193.94 256z"/></svg>`; button.title = "Close this popin"; button.classList.add("close-button"); button.buttonAction = (event) => { event.stopPropagation(); let popin = event.target.closest(".popin"); if (popin) { Popins.removePopin(popin); } }; return button; }, optionsButton: () => { let button = Popins.titleBarComponents.genericButton(); button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 20 20"><g transform="translate(10 10)"><path id="a" d="M1.5-10h-3l-1 6.5h5m0 7h-5l1 6.5h3"/><use transform="rotate(45)" xlink:href="#a"/><use transform="rotate(90)" xlink:href="#a"/><use transform="rotate(135)" xlink:href="#a"/></g><path d="M10 2.5a7.5 7.5 0 000 15 7.5 7.5 0 000-15v4a3.5 3.5 0 010 7 3.5 3.5 0 010-7"/></svg>`; return button; } }, newPopin: (target) => { GWLog("Popins.newPopin", "popins.js", 2); let popin = document.createElement("div"); popin.classList.add("popin", "popframe"); popin.innerHTML = `<div class="popframe-scroll-view"><div class="popframe-content-view"></div></div>`; popin.scrollView = popin.querySelector(".popframe-scroll-view"); popin.contentView = popin.querySelector(".popframe-content-view"); popin.contentView.popin = popin.scrollView.popin = popin; popin.titleBarContents = []; popin.spawningTarget = target; return popin; }, setPopFrameContent: (popin, contentHTML) => { popin.contentView.innerHTML = contentHTML; return (contentHTML > ""); }, injectPopinForTarget: (target) => {
        GWLog("Popins.injectPopinForTarget", "popins.js", 2); target.popFrame = target.popin = Popins.newPopin(target); if (!(target.popFrame = target.popin = target.preparePopin(target.popin)))
            return; if (target.popin.titleBarContents.length > 0)
            Popins.addTitleBarToPopin(target.popin); let containingDocument = Popins.containingDocumentForTarget(target); containingDocument.querySelectorAll(".popin").forEach(existingPopin => {
                if (existingPopin != target.popin)
                    Popins.removePopin(existingPopin);
            }); if (containingDocument.popin) { containingDocument.popin.lastScrollTop = containingDocument.popin.scrollView.scrollTop; containingDocument.popin.parentElement.insertBefore(target.popin, containingDocument.popin); } else { target.parentElement.insertBefore(target.popin, target.nextSibling); }
        target.classList.add("popin-open", "highlighted"); requestAnimationFrame(() => { Popins.scrollPopinIntoView(target.popin); }); GW.notificationCenter.fireEvent("Popins.popinDidInject", { popin: target.popin });
    }, scrollPopinIntoView: (popin) => { let popinViewportRect = popin.getBoundingClientRect(); if (popinViewportRect.bottom > window.innerHeight) { window.scrollBy(0, (window.innerHeight * 0.1) + popinViewportRect.bottom - window.innerHeight); } else if (popinViewportRect.top < 0) { window.scrollBy(0, (window.innerHeight * -0.1) + popinViewportRect.top); } }, removePopin: (popin) => {
        GWLog("Popins.removePopin", "popins.js", 2); let popinBelow = (popin.nextElementSibling && popin.nextElementSibling.classList.contains("popin")) ? popin.nextElementSibling : null; popin.remove(); if (popinBelow)
            popinBelow.scrollView.scrollTop = popinBelow.lastScrollTop; Popins.detachPopinFromTarget(popin);
    }, detachPopinFromTarget: (popin) => { GWLog("Popins.detachPopinFromTarget", "popins.js", 2); popin.spawningTarget.popin = null; popin.spawningTarget.popFrame = null; popin.spawningTarget.classList.remove("popin-open", "highlighted"); }, isSpawned: (popin) => { return (popin != null); }, targetClicked: (event) => {
        GWLog("Popins.targetClicked", "popins.js", 2); event.preventDefault(); let target = event.target.closest(".spawns-popin"); if (target.classList.contains("popin-open")) { Popins.allSpawnedPopins().forEach(popin => { Popins.removePopin(popin); }); } else { Popins.injectPopinForTarget(target); }
        document.activeElement.blur();
    },
}; GW.notificationCenter.fireEvent("Popins.didLoad"); doWhenPageLoaded(() => { Popins.setup(); });