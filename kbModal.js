/*global console*/
// get the browser specific transitionEnd event name (https://gist.github.com/O-Zone/7230245)
//(function(c){var d={MozTransition:"transitionend",WebkitTransition:"webkitTransitionEnd",transition:"transitionEnd",MSTransition:"msTransitionEnd",OTransition:"oTransitionEnd"},b=c.document.createElement("div");for(var a in d){if(b.style[a]!==undefined){c.transitionEnd=d[a];break}}})(window);

(function (window, document) {
    // miliseconds before removing the modal dialog in browsers that don't support transitionEnd event
    // Let this be a bit more than the slowest transition in the css file (probably the .dkKbModalDialog)
    var MILISECONDSTOREMOVEELEMENTSAFTERHIDINGMODAL = 350;

    // --- helper functions ---
    // DeleteAfterUse For testing purposes only!
    function log(str) {
        if (typeof console !== 'undefined') {
            console.log(str);
        }
    }

    // getElementsByClassName Polyfill (modified from https://gist.github.com/eikes/2299607)
    function getElementsByClassName(className, rootElem) {
        rootElem = rootElem || document;
        if (!Element.prototype.getElementsByClassName) {
            var results = []; 
            if (rootElem.querySelectorAll) { // IE8
                log('getElementsByClassName: Getting "' + className + '" IE8 way (querySelectorAll).');
                return rootElem.querySelectorAll('.' + className);
            } else {
                var i, pattern, elements;
                if (rootElem.evaluate) { // IE6, IE7
                    log('getElementsByClassName: Getting "' + className + '" IE6 + IE7 way (evaluate).');
                    pattern = ".//*[contains(concat(' ', @class, ' '), ' " + className + " ')]";
                    elements = rootElem.evaluate(pattern, document, null, 0, null);
                    while ((i = elements.iterateNext())) {
                        results.push(i);
                    }
                } else { // Strange browsers from outer space without getElementsByClassName, querySelectorAll and XPath 1.0
                    log('getElementsByClassName: Getting "' + className + '" strange browser way (getElementsByTagName(*) - this ought not to happen!).');
                    elements = document.getElementsByTagName("*");
                    pattern = new RegExp("(^|\\s)" + className + "(\\s|$)");
                    for (i = 0; i < elements.length; i++) {
                        if ( pattern.test(elements[i].className) ) {
                            results.push(elements[i]);
                        }
                    }
                }
            }
            return results;
        } else {
            // All other browsers
            log('getElementsByClassName: Getting "' + className + '" modern browser way (getElementsByClassName).');
            return rootElem.getElementsByClassName(className);
        }
    }

    // crossbrowser addEventListener function (from http://stackoverflow.com/questions/10149963/adding-event-listener-cross-browser)
    function addEvent(elem, event, fn) {
        // avoid memory overhead of new anonymous functions for every event handler that's installed
        // by using local functions
        function listenHandler(e) {
            var ret = fn.apply(this, arguments);
            if (ret === false) {
                e.stopPropagation();
                e.preventDefault();
            }
            return(ret);
        }

        function attachHandler() {
            // set the this pointer same as addEventListener when fn is called
            // and make sure the event is passed to the fn also so that works the same too
            var ret = fn.call(elem, window.event);   
            if (ret === false) {
                window.event.returnValue = false;
                window.event.cancelBubble = true;
            }
            return(ret);
        }

        if (elem.addEventListener) {
            elem.addEventListener(event, listenHandler, false);
        } else {
            elem.attachEvent("on" + event, attachHandler);
        }
    }

    function setClassFromArray(elem, allClasses) {
        switch (allClasses.length) {
        case 0 :
            elem.className = null;
            break;
        case 1 :
            elem.className = allClasses[0];
            break;
        default:
            elem.className = allClasses.join(' ');
        }
    }

    function setClass(elem, className, reset) {
        var index = -1,
            tmpClasses = elem.className === '' ? [] : elem.className.split(' ');
        for (var i = 0; i < tmpClasses.length; i += 1) {
            if (tmpClasses[i] === className) {
                index = i;
                break;
            }
        }
        if (reset) {
            if (index >= 0) {
                tmpClasses.splice(index, 1);
                setClassFromArray(elem, tmpClasses);
            }
        } else {
            if (index === -1) {
                tmpClasses.push(className);
                setClassFromArray(elem, tmpClasses);
            }
        }
    }

    // wait for DOM ready
    addEvent(document, 'readystatechange', function () {
        if (document.readyState === "complete") {

            // --- setting up the modalDialog elements ---
            var modalOuterContainer = document.createElement('div');
            modalOuterContainer.className = 'dkKbModalOuterContainer';
            modalOuterContainer.innerHTML = '<div class="dkKbModalContainer dkKbModal dkKbFade">' +
                '<div class="dkKbModalDialog">' +
                    '<div class="dkKbModalDialogHeader">' +
                        '<button class="dkKbCloseButton">&times;</button>' +
                        '<h3 class="dkKbModalHeader"></h3>' +
                    '</div>' +
                    '<div class="dkKbModalBody"></div>' +
                '</div>' +
            '</div>';
            var modalOverlay = document.createElement('div');
            modalOverlay.className = 'dkKbModalOverlay dkKbFade';
            document.body.appendChild(modalOuterContainer);
            document.body.appendChild(modalOverlay);

            // --- getting handlers to everything important
            var closeButton = getElementsByClassName('dkKbCloseButton')[0],
                modalContainer = getElementsByClassName('dkKbModalContainer')[0],
                modalDialog = getElementsByClassName('dkKbModalDialog', modalContainer)[0],
                modalHeader = getElementsByClassName('dkKbModalHeader', modalContainer)[0],
                modalBody = getElementsByClassName('dkKbModalBody', modalContainer)[0],

                turnOnModal = getElementsByClassName('dkKbTurnOnModal')[0];

            // --- setting up the window.dkKbModal object
            window.dkKbModal = {
                show : function (header, body) {
                    if (header) { // set header and body
                        modalHeader.innerHTML = header;
                        if ((typeof body === 'string') || (body instanceof String)) {
                            modalBody.innerHTML = body;
                        } else if (body instanceof Element) {
                            //empty old node;
                            while (modalBody.lastChild) {
                                modalBody.removeChild(modalBody.lastChild);
                            }
                            modalBody.appendChild(body);
                        }
                    }

                    // turn on the modal dialog
                    setClass(document.body, 'dkKbModalOpen');
                    modalOverlay.style.display = 'block';
                    modalOuterContainer.style.display = 'block';
                    modalContainer.style.display = 'block';
                    setTimeout(function () {
                        setClass(modalOverlay, 'dkKbShown');
                        setClass(modalContainer, 'dkKbShown');
                        setClass(modalOverlay, 'dkKbShown');
                    }, 0);
                },
                hide : function () {
                    setClass(document.body, 'dkKbModalOpen', true);
                    setClass(modalOverlay, 'dkKbShown', true);
                    setClass(modalContainer, 'dkKbShown', true);
                    if (!window.transitionEnd) {
                        // this browser does not support transitionEnd event - wait a bit to turn off dkKbModalOuterContainer and dkKbModalOverlay
                        window.setTimeout(function () {
                            modalContainer.style.display = 'none';
                            modalOuterContainer.style.display = 'none';
                            modalOverlay.style.display = 'none';
                        }, MILISECONDSTOREMOVEELEMENTSAFTERHIDINGMODAL);
                    }
                }
            };

            // --- setting up eventhandlers ---
            if (window.transitionEnd) {
                addEvent(modalContainer, window.transitionEnd, function(e){
                    if (e.propertyName === 'opacity') {
                        if (modalContainer.className.indexOf('dkKbShown') < 0) {
                            modalContainer.style.display = 'none';
                            modalOuterContainer.style.display = 'none';
                            modalOverlay.style.display = 'none';
                        }
                    }
                });
            } // NOTE: If browser does not support transitionEnd event it will just wait a bit and close the modal layers from the 
            addEvent(closeButton, 'click', window.dkKbModal.hide);
            addEvent(modalOuterContainer, 'click', window.dkKbModal.hide);
            addEvent(modalDialog, 'click', function (e) {
                e.stopPropagation();
            });
            addEvent(turnOnModal, 'click', function () { window.dkKbModal.show('Testing...','This is da testing body!');});


        }
    });
})(window, window.document);

