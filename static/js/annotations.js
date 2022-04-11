Annotations = {
    annotationsBasePathname: "/metadata/annotations/", annotationReferenceElementSelectors: ["a.docMetadata"], annotationReferenceElementSelectorPrefix: ".annotation > p ", annotationsWorkspace: null, cleanup: () => {
        GWLog("Annotations.cleanup", "annotations.js", 1); if (Annotations.annotationsWorkspace)
            Annotations.annotationsWorkspace.remove(); GW.notificationCenter.removeHandlerForEvent("GW.contentDidLoad", signalAnnotationLoaded); GW.notificationCenter.removeHandlerForEvent("GW.contentLoadDidFail", signalAnnotationLoadFailed); GW.notificationCenter.fireEvent("Annotations.cleanupDidComplete");
    }, setup: () => { GWLog("Annotations.setup", "annotations.js", 1); document.body.insertAdjacentHTML("beforeend", `<div id="annotations-workspace" style="display:none;"></div>`); Annotations.annotationsWorkspace = document.querySelector("#annotations-workspace"); GW.notificationCenter.addHandlerForEvent("GW.contentDidLoad", Annotations.signalAnnotationLoaded = (info) => { GWLog("Annotations.signalAnnotationLoaded", "annotations.js", 2); Annotations.cachedAnnotations[info.identifier] = info.document; info.document.remove(); GW.notificationCenter.fireEvent("Annotations.annotationDidLoad", { identifier: info.identifier }); }, { phase: ">rewrite", condition: (info) => (info.document.parentElement && info.document.parentElement == Annotations.annotationsWorkspace) }); GW.notificationCenter.addHandlerForEvent("GW.contentLoadDidFail", Annotations.signalAnnotationLoadFailed = (info) => { GWLog("Annotations.signalAnnotationLoadFailed", "annotations.js", 2); Annotations.cachedAnnotations[info.identifier] = "LOADING_FAILED"; GW.notificationCenter.fireEvent("Annotations.annotationLoadDidFail", { identifier: info.identifier }); }, { condition: (info) => info.document == Annotations.annotationsWorkspace }); GW.notificationCenter.fireEvent("Annotations.setupDidComplete"); }, cachedAnnotations: {}, cachedAnnotationExists: (annotationIdentifier) => { let cachedAnnotation = Annotations.cachedAnnotations[annotationIdentifier]; return (cachedAnnotation && cachedAnnotation != "LOADING_FAILED"); }, annotationForIdentifier: (annotationIdentifier) => { return Annotations.cachedAnnotations[annotationIdentifier]; }, annotationURLForIdentifier: (annotationIdentifier) => {
        let annotationURL; if (Annotations.isWikipediaLink(annotationIdentifier)) { annotationURL = new URL(annotationIdentifier); let wikiPageName = /\/([^\/]+?)$/.exec(annotationURL.pathname)[1]; annotationURL.originalPathname = annotationURL.pathname; annotationURL.pathname = `/api/rest_v1/page/mobile-sections/${wikiPageName}`; } else {
            annotationURL = new URL("https://test"
                + location.hostname
                + Annotations.annotationsBasePathname
                + fixedEncodeURIComponent(fixedEncodeURIComponent(annotationIdentifier))
                + ".html");
        }
        return annotationURL;
    }, stageAnnotation: (annotationRawHTML) => { Annotations.annotationsWorkspace.insertAdjacentHTML("beforeend", `<div class="annotation">${annotationRawHTML}</div>`); return Annotations.annotationsWorkspace.lastElementChild; }, loadAnnotation: (annotationIdentifier) => {
        GWLog("Annotations.loadAnnotation", "annotations.js", 2); let annotationURL = Annotations.annotationURLForIdentifier(annotationIdentifier); doAjax({
            location: annotationURL.href, onSuccess: (event) => {
                let annotation; if (Annotations.isWikipediaLink(annotationIdentifier)) { annotation = Annotations.stagedAnnotationFromWikipediaAPIResponse(event.target.responseText, annotationURL); if (annotation) { Annotations.postProcessStagedWikipediaAnnotation(annotation, annotationURL); } else { doAjax({ location: `${location.origin}/error/` + fixedEncodeURIComponent(annotationURL) }); } } else { annotation = Annotations.stageAnnotation(event.target.responseText); }
                if (annotation) { GW.notificationCenter.fireEvent("GW.contentDidLoad", { source: "Annotations.loadAnnotation", document: annotation, location: annotationURL, identifier: annotationIdentifier, flags: GW.contentDidLoadEventFlags.needsRewrite }); } else { GW.notificationCenter.fireEvent("GW.contentLoadDidFail", { source: "Annotations.loadAnnotation", document: Annotations.annotationsWorkspace, identifier: annotationIdentifier, location: annotationURL }); }
            }, onFailure: (event) => { GW.notificationCenter.fireEvent("GW.contentLoadDidFail", { source: "Annotations.loadAnnotation", document: Annotations.annotationsWorkspace, location: annotationURL, identifier: annotationIdentifier }); doAjax({ location: `${location.origin}/error/` + fixedEncodeURIComponent(annotationURL) }); }
        });
    }, referenceDataForAnnotationIdentifier: (annotationIdentifier) => { let referenceEntry = Annotations.cachedAnnotations[annotationIdentifier]; if (Annotations.isWikipediaLink(annotationIdentifier)) { return Annotations.referenceDataForWikipediaEntry(referenceEntry); } else { return Annotations.referenceDataForLocalAnnotation(referenceEntry); } }, referenceDataForLocalAnnotation: (referenceEntry) => {
        let referenceElement = referenceEntry.querySelector(Annotations.annotationReferenceElementSelectors.map(selector => `${Annotations.annotationReferenceElementSelectorPrefix}${selector}`).join(", ")); let authorElement = referenceEntry.querySelector(".author"); let authorList; if (authorElement) {
            authorList = authorElement.textContent.split(", ").slice(0, 3).join(", "); if (authorList.length < authorElement.textContent.length)
                authorList += " et al";
        }
        let dateElement = referenceEntry.querySelector(".date"); let tagsElement = referenceEntry.querySelector(".link-tags"); let backlinksElement = referenceEntry.querySelector(".backlinks"); let similarElement = referenceEntry.querySelector(".similars"); return {
            element: referenceElement, titleHTML: referenceElement.innerHTML.trimQuotes(), authorHTML: (authorElement ? `<span class="data-field author">${authorList}</span>` : ``), dateHTML: (dateElement ? ` (<span class="data-field date" title="${dateElement.textContent}">` +
                dateElement.textContent.replace(/-[0-9][0-9]-[0-9][0-9]$/, "") +
                `</span>)` : ``), tagsHTML: (tagsElement ? `<span class="data-field link-tags">${tagsElement.innerHTML}</span>` : ``), backlinksHTML: (backlinksElement ? `<span class="data-field backlinks">${backlinksElement.innerHTML}</span>` : ``), similarHTML: (similarElement ? `<span class="data-field similars" >${similarElement.innerHTML}</span>` : ``), abstractHTML: referenceEntry.querySelector("blockquote div").innerHTML
        };
    }, isWikipediaLink: (annotationIdentifier) => {
        if (/^[\?\/]/.test(annotationIdentifier))
            return false; let url = new URL(annotationIdentifier); return (url && /(.+?)\.wikipedia\.org/.test(url.hostname));
    }, referenceDataForWikipediaEntry: (referenceEntry) => { return { element: referenceEntry, titleHTML: referenceEntry.dataset["titleHTML"], authorHTML: `<span class="data-field author">Wikipedia</span>`, dateHTML: ``, tagsHTML: ``, backlinksHTML: ``, abstractHTML: referenceEntry.innerHTML }; }, stagedAnnotationFromWikipediaAPIResponse: (responseText, annotationURL) => {
        let response = JSON.parse(responseText); let targetSection; if (annotationURL.hash > "") {
            targetSection = response["remaining"]["sections"].find(section => section["anchor"] == decodeURIComponent(annotationURL.hash).substr(1)); if (!targetSection)
                return null;
        }
        let responseHTML = response["lead"]["sections"][0]["text"]
            + response["remaining"]["sections"].map(section => `<h2 id='${section["anchor"]}'>${section["line"]}</h2>\n${section["text"]}`).join(""); annotation = Annotations.stageAnnotation(responseHTML); annotation.dataset["titleHTML"] = response["lead"]["displaytitle"]; return annotation;
    }, wikipediaEntryExtraneousElementSelectors: [".mw-ref", ".shortdescription", ".plainlinks", "td hr", ".hatnote", ".portal", ".penicon", ".reference", ".Template-Fact", ".error", ".mwe-math-mathml-inline"], postProcessStagedWikipediaAnnotation: (annotation, annotationURL) => {
        annotation.querySelectorAll(Annotations.wikipediaEntryExtraneousElementSelectors.join(", ")).forEach(element => { element.remove(); }); annotation.querySelectorAll(".locmap").forEach(locmap => { locmap.closest("tr").remove(); }); annotation.querySelectorAll("p:empty").forEach(emptyGraf => { emptyGraf.remove(); }); annotation.querySelectorAll("a").forEach(link => {
            if (link.getAttribute("href").startsWith("#"))
                link.pathname = annotationURL.originalPathname; if (link.hostname == location.hostname)
                link.hostname = annotationURL.hostname; if (/(.+?)\.wikipedia\.org/.test(link.hostname)) { link.classList.add("docMetadata"); link.dataset.linkIcon = "wikipedia"; link.dataset.linkIconType = "svg"; }
            if (link.pathname == annotationURL.originalPathname)
                link.classList.add("link-self");
        }); annotation.querySelectorAll("[style]").forEach(element => { element.removeAttribute("style"); }); annotation.querySelectorAll("a img").forEach(imageLink => { imageLink.parentElement.outerHTML = imageLink.outerHTML; }); annotation.querySelectorAll("th:not(:only-child)").forEach(cell => { cell.outerHTML = `<td>${cell.innerHTML}</td>`; }); annotation.querySelectorAll("table.sidebar").forEach(table => { table.classList.toggle("infobox", true); }); let thumbnail = annotation.querySelector("img"); if (thumbnail && thumbnail.closest("table")) {
            let thumbnailContainer = thumbnail.parentElement; let figure = document.createElement("figure"); figure.classList.add("float-right"); figure.appendChild(thumbnail); let caption = annotation.querySelector(".mw-default-size + div"); if (caption && caption.textContent > "") { let figcaption = document.createElement("figcaption"); figcaption.innerHTML = caption.innerHTML; figure.appendChild(figcaption); }
            annotation.insertBefore(figure, annotation.firstElementChild); thumbnailContainer.closest("table").classList.toggle("infobox", true); thumbnailContainer.closest("tr").remove();
        } else if (thumbnail && thumbnail.closest("figure")) {
            let figure = thumbnail.closest("figure"); annotation.insertBefore(figure, annotation.firstElementChild); figure.classList.add("float-right"); let caption = figure.querySelector("figcaption"); if (caption.textContent == "")
                caption.remove();
        }
    }
}; GW.notificationCenter.fireEvent("Annotations.didLoad"); doWhenPageLoaded(() => { Annotations.setup(); });