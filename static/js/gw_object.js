/*  Create global 'GW' object, if need be.
*/
if (typeof window.GW == "undefined")
    window.GW = {};

/********************************/
/*	Events fired by gw-inline.js:

GW.contentDidLoad {
    source: "DOMContentLoaded"
    document: 
    The main element (i.e., <html>) of the main page.
    location: 
    URL of the main page, as loaded.
    flags: (  GW.contentDidLoadEventFlags.isMainDocument
    | GW.contentDidLoadEventFlags.needsRewrite
    | GW.contentDidLoadEventFlags.clickable
    | GW.contentDidLoadEventFlags.collapseAllowed
    | GW.contentDidLoadEventFlags.isFullPage
    | GW.contentDidLoadEventFlags.fullWidthPossible)
}
Fired when the browser DOMContentLoaded event fires. Loaded content is
the full page itself.
*/

/*****************/
/* MEDIA QUERIES */
/*****************/

GW.mediaQueries = {
    mobileWidth: matchMedia("(max-width: 649px)"),
    systemDarkModeActive: matchMedia("(prefers-color-scheme: dark)"),
    hoverAvailable: matchMedia("only screen and (hover: hover) and (pointer: fine)"),
    portraitOrientation: matchMedia("(orientation: portrait)")
};

GW.isMobile = () => {
    /*  We consider a client to be mobile if one of two conditions obtain:
    1. JavaScript detects touch capability, AND viewport is narrow; or,
    2. CSS does NOT detect hover capability.
    */
    return ((('ontouchstart' in document.documentElement)
        && GW.mediaQueries.mobileWidth.matches)
        || !GW.mediaQueries.hoverAvailable.matches);
};

GW.isFirefox = () => {
    return (navigator.userAgent.indexOf("Firefox") > 0);
};

/********************/
/* DEBUGGING OUTPUT */
/********************/

GW.dateTimeFormat = new Intl.DateTimeFormat([], { hour12: false, hour: "numeric", minute: "numeric", second: "numeric" });

function GWTimestamp() {
    let time = Date.now();
    let ms = `${(time % 1000)}`.padStart(3, '0');
    let timestamp = `${GW.dateTimeFormat.format(time)}.${ms}`;

    return timestamp;
}

GW.logLevel = localStorage.getItem("gw-log-level") || 0;
GW.logSourcePadLength = 28;

function GWLog(string, source = "", level = 1) {
    if (GW.logLevel < level)
        return;

    let sourcestamp = (source > "" ? `[${source}]` : `[ ]`).padEnd(GW.logSourcePadLength, ' ');

    console.log(`[${GWTimestamp()}]  ` + sourcestamp + string);
}
GW.setLogLevel = (level, permanently = false) => {
    if (permanently)
        localStorage.setItem("gw-log-level", level);

    GW.logLevel = level;
};

function GWStopWatch(f, ...args) {
    let fname = (f.name || f.toString().slice(0, f.toString().indexOf('{')));
    console.log(`[${GWTimestamp()}]  ${fname} [BEGIN]`);
    let rval = f(...args);
    console.log(`[${GWTimestamp()}]  ${fname} [END]`);
    return rval;
}

/***********/
/* HELPERS */
/***********/

/*  Because encodeURIComponent does not conform to RFC 3986; see MDN docs.
*/
function fixedEncodeURIComponent(str) {
    return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
        return '%' + c.charCodeAt(0).toString(16);
    });
}

/*  Helper function for AJAX, by kronusaturn
https://github.com/kronusaturn/lw2-viewer/blob/master/www/script.js
*/
function urlEncodeQuery(params) {
    return (Object.keys(params)).map(x => (`${x}=${fixedEncodeURIComponent(params[x])}`)).join("&");
}

/*  Helper function for AJAX, by kronusaturn
https://github.com/kronusaturn/lw2-viewer/blob/master/www/script.js
*/
function doAjax(options) {
    let req = new XMLHttpRequest();
    req.addEventListener("load", (event) => {
        if (event.target.status < 400) {
            if (options["onSuccess"])
                options.onSuccess(event);
        } else {
            if (options["onFailure"])
                options.onFailure(event);
        }
    });
    req.addEventListener("error", (event) => {
        if (options["onFailure"])
            options.onFailure(event);
    });
    let method = (options["method"] || "GET");
    let location = (options.location || document.location)
        + ((options.params && method == "GET") ? ("?" + urlEncodeQuery(options.params)) : "");
    req.open(method, location);
    if (options["method"] == "POST") {
        req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        req.send(urlEncodeQuery(options.params));
    } else {
        req.send();
    }
}

/*  Adds an event listener to a button (or other clickable element), attaching
it to both ‘click’ and ‘keyup’ events (for use with keyboard navigation).
Optionally also attaches the listener to the ‘mousedown’ event, making the
element activate on mouse down instead of mouse up.
*/
Element.prototype.addActivateEvent = function (fn, includeMouseDown) {
    let ael = this.activateEventListener = (event) => {
        if (event.button === 0
            || event.key === ' ')
            fn(event);
    };
    this.addEventListener("click", ael);
    this.addEventListener("keyup", ael);
    if (includeMouseDown)
        this.addEventListener("mousedown", ael);
}

/*  Swap classes on the given element.
First argument is an array with two string elements (the classes).
Second argument is 0 or 1 (index of class to add; the other is removed).
*/
Element.prototype.swapClasses = function (classes, whichToAdd) {
    this.classList.add(classes[whichToAdd]);
    this.classList.remove(classes[1 - whichToAdd]);
};

/*	Returns true if the point is within the given rect, false otherwise.
*/
function pointWithinRect(point, rect) {
    return (point.x >= rect.left
        && point.x <= rect.right
        && point.y >= rect.top
        && point.y <= rect.bottom);
}

/*  Returns true if the given rects intersect, false otherwise.
*/
function doRectsIntersect(rectA, rectB) {
    return (rectA.top < rectB.bottom
        && rectA.bottom > rectB.top
        && rectA.left < rectB.right
        && rectA.right > rectB.left);
}

/*  Returns true if the given element intersects the given rect,
false otherwise.
*/
function isWithinRect(element, rect) {
    return doRectsIntersect(element.getBoundingClientRect(), rect);
}

/*  Returns true if the given element intersects the viewport, false otherwise.
*/
function isOnScreen(element) {
    return isWithinRect(element, new DOMRect(0, 0, window.innerWidth, window.innerHeight));
}

/*  Returns the string trimmed of opening/closing quotes.
*/
String.prototype.trimQuotes = function () {
    return this.replace(/^["'“‘]?(.+?)["'”’]?$/, '$1');
};

/*  Returns true if the string begins with any of the given prefixes.
*/
String.prototype.startsWithAnyOf = function (prefixes) {
    for (prefix of prefixes)
        if (this.startsWith(prefix))
            return true;
    return false;
}

/*  Returns true if the string ends with any of the given suffixes.
*/
String.prototype.endsWithAnyOf = function (suffixes) {
    for (suffix of suffixes)
        if (this.endsWith(suffix))
            return true;
    return false;
}

/*  Returns true if the string includes any of the given substrings.
*/
String.prototype.includesAnyOf = function (substrings) {
    for (substring of substrings)
        if (this.includes(substring))
            return true
    return false;
}

/*  Remove given item from array.
*/
Array.prototype.remove = function (item) {
    let index = this.indexOf(item);
    if (index !== -1)
        this.splice(index, 1);
};

/*  Remove from array the first item that passes the provided test function.
The test function should take an array item and return true/false.
*/
Array.prototype.removeIf = function (test) {
    let index = this.findIndex(test);
    if (index !== -1)
        this.splice(index, 1);
};

/*  Insert the given item into the array just before the first item that passes
the provided test function. If no item passes the test function, append the
item to the end of the array.
*/
Array.prototype.insertBefore = function (item, test) {
    let index = this.findIndex(test);
    if (index === -1) {
        this.push(item);
    } else {
        this.splice(index, 0, item);
    }
};

/*	Product of two string arrays. (Argument can be a string, which is equivalent
to passing an array with a single string member.)
Returns array whose members are all results of concatenating each left hand
array string with each right hand array string, e.g.:

[ "a", "b" ].π([ "x", "y" ])

will return:

[ "ax", "ay", "bx", "by" ]

Any non-string argument must be iterable, else null is returned. Any 
members of a passed array (or other iterable object), whatever their types,
are stringified and interpolated into the resulting product strings.
*/
Array.prototype.π = function (strings) {
    if (typeof strings == "string")
        strings = [strings];

    if (!!strings[Symbol.iterator] == "false")
        return null;

    let product = [];
    for (lhs of this) {
        for (rhs of strings) {
            product.push(`${lhs}${rhs}`);
        }
    }
    return product;
};

/*	As Array.π, but applies sequentially to each argument. (First argument may
be a string, which is impossible with the Array member version.)
*/
function _π(...args) {
    if (args.length == 0)
        return [];

    let product = [""];
    for (arg of args)
        product = product.π(arg);

    return product;
}

/*  Run the given function immediately if the page is already loaded, or add
a listener to run it as soon as the page loads.
*/
function doWhenPageLoaded(f) {
    if (document.readyState == "complete")
        f();
    else
        window.addEventListener("load", () => { f(); });
}

/*  Run the given function immediately if the page content has already loaded
(DOMContentLoaded event has fired), or add a listener to run it as soon as
the event fires.
*/
function doWhenDOMContentLoaded(f) {
    if (GW.DOMContentLoaded == true)
        f();
    else
        window.addEventListener("DOMContentLoaded", () => { f(); });
}

/*	Run the given function immediately if the <body> element has already been
    created, or add a mutation observer to run it as soon as the <body> element
        is created.
        */
function doWhenBodyExists(f) {
    if (document.body) {
        f();
    } else {
        let observer = new MutationObserver((mutationsList, observer) => {
            if (document.body) {
                observer.disconnect();
                f();
            }
        });

        observer.observe(document.documentElement, { childList: true });
    }
}

/*  Given an HTML string, creates an element from that HTML, adds it to
#ui-elements-container (creating the latter if it does not exist), and
returns the created element.
*/
function addUIElement(element_html) {
    let ui_elements_container = document.querySelector("#ui-elements-container");
    if (!ui_elements_container) {
        ui_elements_container = document.createElement("div");
        ui_elements_container.id = "ui-elements-container";
        document.querySelector("body").appendChild(ui_elements_container);
    }

    ui_elements_container.insertAdjacentHTML("beforeend", element_html);
    return ui_elements_container.lastElementChild;
}

GW.scrollListeners = {};
/*  Adds a scroll event listener to the page.
*/
function addScrollListener(fn, name) {
    let wrapper = (event) => {
        requestAnimationFrame(() => {
            fn(event);
            document.addEventListener("scroll", wrapper, { once: true, passive: true });
        });
    }
    document.addEventListener("scroll", wrapper, { once: true, passive: true });

    /*	Retain a reference to the scroll listener, if a name is provided.
    */
    if (typeof name != "undefined") {
        GW.scrollListeners[name] = wrapper;
    }
}
/*  Removes a named scroll event listener from the page.
*/
function removeScrollListener(name) {
    let wrapper = GW.scrollListeners[name];
    if (wrapper) {
        document.removeEventListener("scroll", wrapper);
        GW.scrollListeners[name] = null;
    }
}

/*	When the given event is triggered on the given target, after the given delay
call the given handler function. (Optionally, if the given cancel event
occurs in the interim - i.e. after the trigger event happens but before the
delay elapses - cancel calling the handler.)

Return value of this function is an anonymous function which removes the 
listeners that this function adds.

NOTE: If `delay` is 0 or less, then `cancelEventName` is ignored, and `func`
is added as an event handler for `triggerEventName` directly.

If `delay` is positive, then `func` will be called by a timer after `delay` 
ms, prior to which time it might be cancelled if `cancelEventName` (if any)
occurs. (If `cancelEventName` is null, then `func` will be called after
`delay` unconditionally.)
*/
function onEventAfterDelayDo(target, triggerEventName, delay, func, cancelEventName = null) {
    if (delay <= 0) {
        target.addEventListener(triggerEventName, func);
        return (() => {
            target.removeEventListener(triggerEventName, func);
        });
    } else {
        let timer = null;
        let events = {};
        target.addEventListener(triggerEventName, events.triggerEvent = (event) => {
            timer = setTimeout(func, delay, event);
        });
        if (cancelEventName != null) {
            target.addEventListener(cancelEventName, events.cancelEvent = (event) => {
                clearTimeout(timer);
            });
        }
        return (() => {
            target.removeEventListener(triggerEventName, events.triggerEvent);
            if (cancelEventName != null)
                target.removeEventListener(cancelEventName, events.cancelEvent);
        });
    }
}

/*	Causes an element’s contents to become selected.
*/
function selectElementContents(element) {
    var range = document.createRange();
    range.selectNodeContents(element);
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
}

/*  Returns val, or def if val == defval. (By default, defval is -1.)
(In other words, `defval(X,Y,Z)` is “return X if Y is Z [else, just Y]”.)
*/
function defval(def, val, defval = -1) {
    return (val == defval) ? def : val;
}

/*  Returns val, or min if val < min, or max if val > max.
(In other words, clamps val to [min,max].)
*/
function valMinMax(val, min, max) {
    return Math.max(Math.min(val, max), min);
}

/************************/
/* ACTIVE MEDIA QUERIES */
/************************/

/*  This function provides two slightly different versions of its functionality,
depending on how many arguments it gets.

If one function is given (in addition to the media query and its name), it
is called whenever the media query changes (in either direction).

If two functions are given (in addition to the media query and its name),
then the first function is called whenever the media query starts matching,
and the second function is called whenever the media query stops matching.

If you want to call a function for a change in one direction only, pass an
empty closure (NOT null!) as one of the function arguments.

There is also an optional fifth argument. This should be a function to be
called when the active media query is canceled.
*/
function doWhenMatchMedia(mediaQuery, name, ifMatchesOrAlwaysDo, otherwiseDo = null, whenCanceledDo = null) {
    if (typeof GW.mediaQueryResponders == "undefined")
        GW.mediaQueryResponders = {};

    let mediaQueryResponder = (event, canceling = false) => {
        if (canceling) {
            GWLog(`Canceling media query “${name}”`, "media queries", 1);

            if (whenCanceledDo != null)
                whenCanceledDo(mediaQuery);
        } else {
            let matches = (typeof event == "undefined") ? mediaQuery.matches : event.matches;

            GWLog(`Media query “${name}” triggered (matches: ${matches ? "YES" : "NO"})`, "media queries", 1);

            if ((otherwiseDo == null) || matches)
                ifMatchesOrAlwaysDo(mediaQuery);
            else
                otherwiseDo(mediaQuery);
        }
    };
    mediaQueryResponder();
    mediaQuery.addListener(mediaQueryResponder);

    GW.mediaQueryResponders[name] = mediaQueryResponder;
}

/*  Deactivates and discards an active media query, after calling the function
that was passed as the whenCanceledDo parameter when the media query was
added.
*/
function cancelDoWhenMatchMedia(name) {
    GW.mediaQueryResponders[name](null, true);

    for ([key, mediaQuery] of Object.entries(GW.mediaQueries))
        mediaQuery.removeListener(GW.mediaQueryResponders[name]);

    GW.mediaQueryResponders[name] = null;
}

/*****************/
/* NOTIFICATIONS */
/*****************/
/*	The GW.notificationCenter object allows us to register handler functions for
named events. Any number of handlers may be registered for any given named 
event, and when that event is fired, all of its registered handlers will be 
called. Because event handlers are registered for events by event name 
(which may be any string we like), a handler may be registered for an event 
at any time and at any location in the code. (In other words, an event does 
not need to first be “defined”, nor needs to “exist” in any way, in order 
for a handler to be registered for it.)

We can also make the calling of any given event handler conditional (with a 
user-defined, handler-specific condition function [closure] that dynamically 
determines whether its associated handler should be called or not, when the 
event the handler was registered for is fired), specify that an event 
handler should be called only once or many times, and group handlers for a 
particular event into named “phases” (to ensure that certain handlers for an
event are always called before/after others).

Events themselves are also user-defined. Causing an event to fire is as 
simple as calling GW.notificationCenter.fireEvent() and providing an event 
name (which may be any string), plus an event info dictionary (which may 
contain any keys and values we deem necessary, and which will be passed to 
the handler functions); this will trigger the calling of all the handlers
that have been registered for that event name.

See the comments on specific elements of GW.notificationCenter, below, for
more information.
*/
GW.notificationCenter = {
    /*	Dictionary of registered event handlers for named events.
    
    KEYS are event names (e.g. ‘GW.contentDidLoad’).
    
    VALUES are arrays of handler definitions for each event. Each handler
    definition is a dictionary with the following keys/values:
    
    - ‘f’ (key)
    Handler function to call when the named event fires (passing the 
    event info dictionary of the fired event). (See comment on the
    ‘addHandlerForEvent’ function, below, for details.)
    
    - ‘options’ (key) [optional]
    Event options dictionary, with the following keys/values:
    
    - ‘condition’ (key) [optional]
    Test function, to which the event info dictionary of the fired
    event is passed; the handler function is called if (and only if)
    the condition returns true
    
    - ‘once’ (key) [optional]
    Boolean value; if true, the handler will be removed after the 
    handler function is called once (note that if there is a 
    condition function provided [see the ‘condition’ key], the 
    handler function will not be called - and therefore will not be
    removed - if the named event is fired by the condition evaluates 
    to false).
    
    If not set, defaults to false (i.e., by default a handler is 
    not removed after an event is fired once, but will continue to
    be invoked each time the named event fires and the condition,
    if any, evaluates as true).
    
    - ‘phase’ (key) [optional]
    String which specifies when the given handler function should be
    called, relative to other handlers registered for the named
    event.
    
    The format for this string is as follows:
    
    - If the first character is anything other than ‘<’ or ‘>’, the
    entire string is treated as the name of a handler phase. The 
    given handler function will be called in the same handler 
    phase as all other handlers assigned to that phase. (Within a
    phase, handlers are called in the order in which they were
    added.)
    
    - If the first character is ‘<’, then the rest of the string
    is treated as the name of a handler phase. The given handler
    function will be called prior to any handlers assigned to the
    specified phase, but after any handlers assigned to an earlier
    named phase (if any). (Within such a “before phase X” 
    ‘pseudo-phase’, handlers are called in the order in which they 
    were added.)
    
    - If the first character is ‘>’, then the rest of the string
    is treated as the name of a handler phase. The given handler
    function will be called after any handlers assigned to the
    specified phase, but before any handlers assigned to a later
    named phase (if any). (Within such an “after phase X” 
    ‘pseudo-phase’, handlers are called in the order in which they 
    were added.)
    
    When an event is fired, any handlers registered for that event (i.e.,
    members of the array which is the value for that event’s name in the 
    eventHandlers dictionary) are called in array order. (If a condition is
    specified for any given handler, the handler function is only called if
    the condition function - called with the event info dictionary as its
    argument - evaluates true.)
    
    The order of an event handlers array for a given event is, by default, 
    determined by the order in which handlers are registered for that event.
    The value of the ‘phase’ key of an event’s options dictionary can 
    override and modify this default order. (See definition of the ‘phase’ 
    key of an event handler options dictionary, above.)
    */
    eventHandlers: {},

    /*	Defined event handler phases for certain named events.
    (See definition of the ‘phase’ key of an event handler options 
    dictionary, above, for more info.)
    
    Phases are defined in execution order. For example, when the 
    GW.contentDidLoad event (whose handler phases are defined as follows:
    `[ "rewrite", "eventListeners" ]`) fires, event handlers are called in 
    the following order:
    
    1. Handlers assigned to be called before the ‘rewrite’ phase (i.e., 
    those with ‘<rewrite’ as the value of their ‘phase’ key in their
    event handler options dictionary)
    2. Handlers assigned to be called during the ‘rewrite’ phase (i.e., 
    those with ‘rewrite’ as the value of their ‘phase’ key in their
    event handler options dictionary)
    3. Handlers assigned to be called after the ‘rewrite’ phase (i.e., 
    those with ‘>rewrite’ as the value of their ‘phase’ key in their
    event handler options dictionary)
    4. Handlers assigned to be called before the ‘eventListeners’ phase 
    (i.e., those with ‘<eventListeners’ as the value of their ‘phase’ key
    in their event handler options dictionary)
    5. Handlers assigned to be called during the ‘eventListeners’ phase 
    (i.e., those with ‘eventListeners’ as the value of their ‘phase’ key
    in their event handler options dictionary)
    6. Handlers assigned to be called after the ‘eventListeners’ phase 
    (i.e., those with ‘>eventListeners’ as the value of their ‘phase’ key
    in their event handler options dictionary)
    
    (Handlers with no specified phase might be called at any point in this
    sequence, depending on when they were registered.)
    */
    handlerPhaseOrders: {
        "GW.contentDidLoad": ["rewrite", "eventListeners"]
    },

    /*	Register a new event handler for the named event. Arguments are:
    
    - ‘eventName’
    The name of an event (e.g. ‘GW.contentDidLoad’).
    
    - ‘f’
    Event handler function. When the event fires, this function will be
    called. Not that if a condition is specified in the event handler
    options (i.e., if a condition function is provided as the value of
    the ‘condition’ key in the event handler options dictionary), then 
    the handler function will be called only if the condition function 
    evaluates true).
    
    The event handler function should take one argument: an event info
    dictionary. The keys and values of this dictionary are mostly 
    event-specific (but see the ‘fireEvent’ function, below, for more
    info).
    
    - ‘options’ [optional]
    Event handler options dictionary. See comment on the ‘eventHandlers’
    property (above) for info on possible keys/values.
    
    Note that if there already exists a registered event handler for the 
    given event with the same event handler function as the new handler that
    you are trying to register, then the new handler will not be registered
    (even if it has different handler options than the existing handler).
    */
    addHandlerForEvent: (eventName, f, options = {}) => {
        /*	If there’s not already a handlers array for the given event (which
        may be, e.g., because no event handlers have yet been registered 
        for this event), create the array.
        */
        if (GW.notificationCenter.eventHandlers[eventName] == null)
            GW.notificationCenter.eventHandlers[eventName] = [];

        /*	Array of registered handlers for the named event. Might be empty
        (if no handlers have been registered for this event yet).
        */
        let handlers = GW.notificationCenter.eventHandlers[eventName];

        /*	If there is already a registered handler with the same handler 
        function as the one we’re trying to register, do not register this
        new one (even if it has different handler options).
        */
        if (handlers.findIndex(handler => handler.f == f) !== -1)
            return;

        /*	By default, add the new handler to the end of the handlers array
        for this event (so that, when the event is fired, this new handler
        gets called after all the previously registered handlers).
        
        However, if a defined handler phase order exists for the event
        that we’re registering this handler for (see ‘phaseOrder’, below),
        and a phase has been specified in this handler’s options dictionary,
        then that might result in this handler being inserted into the named
        event’s handler array at a different point.
        */
        let insertAt = handlers.length;

        /*	Get the handler phase order for the named event, if any.
        
        (If no handler phases have been defined for the given event, then
        we will ignore the value of the ‘phase’ key in the new handler’s 
        options dictionary, and simply stick with the default behavior of 
        adding the new handler at the end of the event’s handler array.)
        */
        let phaseOrder = GW.notificationCenter.handlerPhaseOrders[eventName];

        /*	If the handler we’re registering isn’t assigned to any particular
        handler phase, we will simply add it to the end of the handler array
        for the given event (and the next large block of code, within the
        conditional below, will not be executed). However, we still want to
        set an empty-string value for the ‘phase’ key of the handler’s
        options dictionary, in order for the ‘phaseAt’ function (below) to
        work properly.
        */
        if (phaseOrder)
            options.phase = (options.phase || "");

        /*	Only if (a) there’s a defined handler phase order for the given 
        event, AND (b) the handler we’re registering is being assigned to a 
        specific phase, do we have anything to do here...
        */
        if (options.phase
            && phaseOrder) {
            /*	Get the target phase name, which may be the full value of the 
            ‘phase’ key of the options dictionary, OR it may be that value
            minus the first character (if the value of the ‘phase’ key 
            begins with a ‘<’ or a ‘>’ character).
            */
            let targetPhase = options.phase.match(/^([<>]?)(.+)/)[2];

            /*	Get the index of the target phase in the defined handler phase 
            order for the named event. If the specified phase is not found
            in the defined handler phase order, set targetPhaseIndex to
            the length of the phase order array, thus ensuring that, by 
            default, the new handler will be appended to the end of the 
            event’s handlers array.
            */
            let targetPhaseIndex = defval(phaseOrder.length, phaseOrder.indexOf(targetPhase), -1);

            /*	Takes an index into the given event’s handler array. Returns a
            dictionary with these keys/values:
            
            - ‘phase’ [key]
            The name of the phase to which the handler at the given
            index is assigned (could be an empty string).
            
            - ‘before’ [key]
            Boolean value; true if the handler at the given index is 
            assigned to run before the specified phase, false otherwise 
            (i.e., if it’s instead assigned to run either during or 
            after the specified phase).
            
            - ‘after’ [key]
            Boolean value; true if the handler at the given index is 
            assigned to run after the specified phase, false otherwise 
            (i.e., if it’s instead assigned to run either before or 
            during the specified phase).
            
            (Note that for an event handler which has not been assigned to
            any specific phase, ‘phase’ will be the empty string, and both
            ‘before’ and ‘after’ will be false.)
            
            Returns null if the given index is out of bounds of the event’s
            handler definitions array.
            */
            let phaseAt = (index) => {
                if (index >= handlers.length)
                    return null;
                let parts = handlers[index].options.phase.match(/^([<>]?)(.+)/);
                return {
                    phase: parts[2],
                    before: (parts[1] == "<"),
                    after: (parts[1] == ">")
                };
            };

            if (options.phase.startsWith("<")) {
                /*	The handler is assigned to be called before the specified
                phase.
                */
                for (var i = 0; i < handlers.length; i++) {
                    /*	We have found the index before which to insert, if the
                    handler at this index is assigned to be called during
                    or after our target phase, OR if it is assigned to be 
                    called before, during, or after any later phase.
                    
                    (In other words, we have passed all the handlers which
                    are assigned either to any earlier phase or to before
                    the specified phase.)
                    */
                    if (phaseAt(i).phase == targetPhase
                        && !phaseAt(i).before)
                        break;
                    if (phaseOrder.slice(targetPhaseIndex + 1).includes(phaseAt(i).phase))
                        break;
                }

                /*	If neither of the break conditions in the loop were 
                encountered, i is now equal to the handler array length,
                and the new handler will be added to the end of the array.
                Otherwise, it’ll be inserted in the appropriate place.
                */
                insertAt = i;
            } else if (options.phase.startsWith(">")) {
                /*	The handler is assigned to be called after the specified
                phase.
                */
                for (var j = handlers.length - 1; j > -1; j--) {
                    /*	We have found the index _after_ which to insert (hence 
                    the `j++`), if the handler at this index is assigned to 
                    be called before, during, or after the target phase, OR
                    if it is assigned to be called before, during, or after
                    any earlier phase.
                    
                    (In other words, we have passed - moving backwards 
                    through the handlers array - all the handlers which
                    are assigned either to any later phase or to after
                    or during the specified phase.)
                    */
                    if (phaseAt(j).phase == targetPhase) {
                        j++;
                        break;
                    }

                    /*	There are no “earlier phases” if the target phase index 
                    is either 0 or out of array bounds of the phase order.
                    (The latter will happen if the target phase is not in
                    the defined phase order for the given event.)
                    */
                    if (targetPhaseIndex > 0
                        && targetPhaseIndex < phaseOrder.length
                        && phaseOrder.slice(0, targetPhaseIndex - 1).includes(phaseAt(j).phase)) {
                        j++;
                        break;
                    }
                }

                /*	If neither of the break conditions in the loop were 
                encountered, j is now equal to -1; in this case, set j to
                the handlers array length, such that the new handler will be
                added to the end of the array.
                Otherwise, it’ll be inserted in the appropriate place.
                */
                insertAt = defval(handlers.length, j, -1);
            } else {
                /*	The handler is assigned to be called during the specified
                phase.
                */
                for (var k = 0; k < handlers.length; k++) {
                    /*	We have found the index before which to insert, if the
                    handler at this index is assigned to be called after the
                    target phase, OR if it is assigned to be called before, 
                    during, or after any later phase.
                    
                    (In other words, we have passed all the handlers which
                    are assigned either to any earlier phase or to before
                    or during the specified phase.)
                    */
                    if (phaseAt(k).phase == targetPhase
                        && phaseAt(k).after)
                        break;
                    if (phaseOrder.slice(targetPhaseIndex + 1).includes(phaseAt(k).phase))
                        break;
                }

                /*	If neither of the break conditions in the loop were 
                encountered, k is now equal to the handler array length,
                and the new handler will be added to the end of the array.
                Otherwise, it’ll be inserted in the appropriate place.
                */
                insertAt = k;
            }
        }

        /*	Add the new event handler to the named event’s handler definitions
        array, at whatever index we have now determined it should go to.
        */
        GW.notificationCenter.eventHandlers[eventName].splice(insertAt, 0, { f: f, options: options });
    },

    /*	Unregister the event handler with the given handler function from the
    specified named event (if such a handler exists).
    */
    removeHandlerForEvent: (eventName, f) => {
        if (GW.notificationCenter.eventHandlers[eventName] == null)
            return;

        GW.notificationCenter.eventHandlers[eventName].removeIf(handler => handler.f == f);
    },

    /*	Unregister all registered event handlers from the specified named event.
    */
    removeAllHandlersForEvent: (eventName) => {
        GW.notificationCenter.eventHandlers[eventName] = null;
    },

    /*	Event-specific pre-fire processing functions. Keys are event names.
    Values are functions that take the event info as an argument, and return
    modified event info.
    */
    prefireProcessors: {

    },

    /*	Fire an event with the given name and event info dictionary.
    
    In addition to printing a console log message (if the log level is set 
    to 1 or higher), this will also cause each event handler that has been
    registered for the named event to be called. (Handlers with a condition
    function specified in their event handler options will first have that
    condition function called, and the handler function will only be called
    if the condition evaluates true.)
    
    The event info dictionary provided to the ‘fireEvent’ function will be
    passed as the argument to each handler function (as well as to any
    condition function that is called to determine whether a handler should
    be called).
    
    The event info dictionary may contain various, mostly event-specific,
    keys and values. The one common key/value that any event’s info 
    dictionary may contain is the ‘source’ key, whose value should be a
    string identifying the function, browser event, or other context which 
    caused the given event to be fired (such as ‘DOMContentLoaded’ or
    ‘Annotations.loadAnnotation’). In addition to any ways in which it may
    be used by an event handler, this string (i.e., the value of the 
    ‘source’ key) is (if present) included in the console message that is 
    printed when the event is fired.
    */
    fireEvent: (eventName, eventInfo) => {
        /*  The ‘16’ here is the width of the date field plus spacing.
        The “Source:” text is manually padded to be as wide 
        as “[notification]”.
        */
        GWLog(`Event “${eventName}” fired.`
            + `${((eventInfo && eventInfo.source)
                ? ("\n"
                    + "".padStart(16, ' ')
                    + "       Source:".padEnd(GW.logSourcePadLength, ' ')
                    + eventInfo.source)
                : ""
            )}`, "notification");

        /*	If no handlers have been registered for this event, we do nothing.
        */
        if (GW.notificationCenter.eventHandlers[eventName] == null)
            return;

        /*	If event-specific pre-fire processing is needed, do it.
        */
        if (GW.notificationCenter.prefireProcessors[eventName])
            eventInfo = GW.notificationCenter.prefireProcessors[eventName](eventInfo);

        /*	Call all registered handlers, in order.
        */
        for (let i = 0; i < GW.notificationCenter.eventHandlers[eventName].length; i++) {
            let handler = GW.notificationCenter.eventHandlers[eventName][i];
            /*	If a condition function is provided, call it to determine 
            whether the handler function should be called.
            */
            if (handler.options.condition
                && handler.options.condition(eventInfo) == false)
                continue;

            /*	If the condition function evaluated true, or if no condition
            function was provided, we call the handler.
            */
            handler.f(eventInfo);

            /*	If the handler options specified a true value for the ‘once’ 
            key, we unregister this handler after having called it once.
            
            (Note that in the case of an once-only handler that’s called 
            conditionally, i.e. one with a specified condition function, 
            regardless of how many times the named event fires, the handler 
            is never automatically removed until its condition evaluates
            true and the handler actually gets called once.)
            */
            if (handler.options.once) {
                GW.notificationCenter.eventHandlers[eventName].splice(i, 1);
                i--;
            }
        }
    }
};

/*	Event-specific boolean flags for the ‘GW.contentDidLoad’ event.

See rewrite.js for details on the meaning of these flags.
*/
GW.contentDidLoadEventFlags = {
    isMainDocument: 1 << 0,
    needsRewrite: 1 << 1,
    clickable: 1 << 2,
    collapseAllowed: 1 << 3,
    isCollapseBlock: 1 << 4,
    isFullPage: 1 << 5,
    fullWidthPossible: 1 << 6
};

/*	Event-specific pre-fire processing for the ‘GW.contentDidLoad’ event.
*/
GW.notificationCenter.prefireProcessors["GW.contentDidLoad"] = (eventInfo) => {
    for ([flagName, flagValue] of Object.entries(GW.contentDidLoadEventFlags))
        eventInfo[flagName] = (0 != (eventInfo.flags & flagValue));

    return eventInfo;
};

/****************/
/* SCROLL STATE */
/****************/

GW.scrollState = {
    lastScrollTop: (window.pageYOffset || document.documentElement.scrollTop),
    unbrokenDownScrollDistance: 0,
    unbrokenUpScrollDistance: 0
};

function updateScrollState(event) {
    GWLog("updateScrollState", "gw.js", 3);

    let newScrollTop = (window.pageYOffset || document.documentElement.scrollTop);
    GW.scrollState.unbrokenDownScrollDistance = (newScrollTop > GW.scrollState.lastScrollTop)
        ? (GW.scrollState.unbrokenDownScrollDistance + newScrollTop - GW.scrollState.lastScrollTop)
        : 0;
    GW.scrollState.unbrokenUpScrollDistance = (newScrollTop < GW.scrollState.lastScrollTop)
        ? (GW.scrollState.unbrokenUpScrollDistance + GW.scrollState.lastScrollTop - newScrollTop)
        : 0;
    GW.scrollState.lastScrollTop = newScrollTop;
}
addScrollListener(updateScrollState, "updateScrollStateScrollListener");

/*  Toggles whether the page is scrollable.
*/
function isPageScrollingEnabled() {
    return !(document.documentElement.classList.contains("no-scroll"));
}
/*	Pass true or false to enable or disable (respectively) page scrolling.
Calling this function with no arguments toggles the state (enables if 
currently disabled, or vice versa).
*/
function togglePageScrolling(enable) {
    if (typeof enable == "undefined")
        enable = document.documentElement.classList.contains("no-scroll");

    let preventScroll = (event) => { document.documentElement.scrollTop = GW.scrollState.lastScrollTop; };

    /*	The `no-scroll` CSS class, which is added to the `html` element when 
    scrolling is disabled by this function (in order to permit the “toggle”
    behavior, i.e. calling ‘togglePageScrolling’ with no arguments), allows
    the assignment of arbitrary CSS properties to the page on the basis of
    scroll state. This is purely a convenience (which may be useful if, for
    example, some styling needs to change on the basis of change in page
    scroll state, e.g. modifying the appearance of scroll bars). No specific
    CSS properties are needed in order for this function to work properly.
    */
    if (enable
        && isPageScrollingEnabled() == false) {
        document.documentElement.classList.toggle("no-scroll", false);
        removeScrollListener("preventScroll");
        addScrollListener(updateScrollState, "updateScrollStateScrollListener");
    } else if (!enable
        && isPageScrollingEnabled() == true) {
        document.documentElement.classList.toggle("no-scroll", true);
        addScrollListener(preventScroll, "preventScroll");
        removeScrollListener("updateScrollStateScrollListener");
    }
}

/******************/
/* BROWSER EVENTS */
/******************/

/*	We know this is false here, because this script is inlined in the <head>
    of the page; so the page body has not yet loaded when this code runs.
    */
GW.DOMContentLoaded = false;

GWLog("document.readyState." + document.readyState, "browser event");
window.addEventListener("DOMContentLoaded", () => {
    GWLog("window.DOMContentLoaded", "browser event");
    GW.DOMContentLoaded = true;
    GW.notificationCenter.fireEvent("GW.contentDidLoad", {
        source: "DOMContentLoaded",
        document: document.firstElementChild,
        location: new URL(location.href),
        flags: (GW.contentDidLoadEventFlags.isMainDocument
            | GW.contentDidLoadEventFlags.needsRewrite
            | GW.contentDidLoadEventFlags.clickable
            | GW.contentDidLoadEventFlags.collapseAllowed
            | GW.contentDidLoadEventFlags.isFullPage
            | GW.contentDidLoadEventFlags.fullWidthPossible)
    });
});
window.addEventListener("load", () => {
    GWLog("window.load", "browser event");
});
document.addEventListener("readystatechange", () => {
    GWLog("document.readyState." + document.readyState, "browser event");
});
