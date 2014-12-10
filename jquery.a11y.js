$(function() {

    var ignoreElements = "a,button,input,select,textarea";
    var styleElements = "b,br,i,abbr,strong";
    var tabIndexElements = 'a, button, input, select, textarea, [tabindex]';
    var tabIndexElementFilter = ':not(.a11y-freeze)';
    var focusableElementsFilter = ":visible:not(.disabled):not([tabindex='-1']):not(:disabled):not(.a11y-no-focus)";
    var focusableElements = "[tabindex='0']"+focusableElementsFilter;
    var ariaLabelElements = "div[aria-label], span[aria-label]";

    var htmlCharRegex = /&.*;/g

    var $activeElementProxy;
    //_.defer(_.bind(func, that)) EQUIVALENT
    var defer = function(func, that) {
        var thisHandle = that || this;
        var args = arguments;
        setTimeout(function() {
            func.apply(thisHandle, args);
        },0);
    };

    //ADD STYLE FOR VISUALLY HIDDEN, SCREENREADER VISIBLE TEXT
    var a11yStyle = $('head').find("style[id='a11y']");
    if (a11yStyle.length === 0) {
        $("<style id='a11y'>").html(".aria-label {\r\n"+
            "position:absolute !important;\r\n"+
            "left:0px !important;\r\n"+
            "width:auto !important;\r\n"+
            "height:auto !important;\r\n"+
            "overflow:auto !important;\r\n"+
            "color: rgba(0,0,0,0) !important;\r\n"+
            "background: rgba(0,0,0,0) !important;\r\n"+
            "font-size: 1px !important;\r\n"+
            "padding:0 !important;\r\n"+
            "margin:0 !important;\r\n"+
        "}\r\n"+
        ".aria-label.aria-hidden {\r\n"+
            "display:none !important;\r\n"+
        "}\r\n"+
        "#a11y-focusguard {\r\n"+
            "position:" + (Modernizr.touch ? "relative" : "fixed") + " !important;\r\n"+
            "left:0px !important;\r\n"+
            "bottom:0px !important;\r\n"+
            "width:auto !important;\r\n"+
            "height:auto !important;\r\n"+
            "overflow:auto !important;\r\n"+
            "color: rgba(0,0,0,0) !important;\r\n"+
            "background: rgba(0,0,0,0) !important;\r\n"+
            "font-size: 1px !important;\r\n"+
            "padding:0 !important;\r\n"+
            "margin:0 !important;\r\n"+
        "}\r\n"+
        "#a11y-selected, #a11y-selected * {\r\n"+
            "position:absolute !important;\r\n"+
            "left:0px !important;\r\n"+
            "bottom:0px !important;\r\n"+
            "width:auto !important;\r\n"+
            "height:auto !important;\r\n"+
            "overflow:auto !important;\r\n"+
            "color: rgba(0,0,0,0) !important;\r\n"+
            "background: rgba(0,0,0,0) !important;\r\n"+
            "font-size: 1px !important;\r\n"+
            "padding:0 !important;\r\n"+
            "margin:0 !important;\r\n"+
        "}\r\n"
        ).appendTo($("head"));
    }

    //PREVENT DEFAULT CLICK ACTION FUNCTION
    var preventDefault = function(event) {
        event.preventDefault();
        event.stopPropagation()
    };

    //CHECK IF ELEMENT HAS FIX POSITION
    var isFixedPosition = function(element) {
        var parents = $(element).parents();
        for (var i = 0; i < parents.length; i++) {
            if ($(parents[i]).css("position") == "fixed") return true;
        }
        return false;
    };

    //SCROLL TO FOCUSED ELEMENT UNLESS FIXED POSITION
    var scrollToFocus = function(event) {
        $activeElementProxy = $(event.target);

        if ($.a11y.options.isOn === false && !$activeElementProxy.is("#a11y-selectted")) $("#a11y-selected").focusNoScroll();
        //console.log ("Focused on:")
        //console.log($activeElementProxy);
        var readText;
        if ($(event.target).attr("aria-labelledby")) {
            var label = $("#"+$(event.target).attr("aria-labelledby"));
            readText = label.attr("aria-label") || label.text();
        } else readText = $(event.target).attr("aria-label") || $(event.target).text();
        $($.a11y).trigger("reading", readText.trim());

        if ($activeElementProxy.is(".a11y-no-focus")) return;
        if (!$.a11y.isOn) return;
        if ($(event.target).is("#a11y-focusguard")) return;
        if (isFixedPosition(event.target)) {
            return;
        }
        var offset = $.a11y.options.offsetTop;
        var to = $(event.target).offset()["top"]
        var st = $(window).scrollTop() + offset;
        var bottomoffset = $.a11y.options.offsetBottom;
        var stbottom = st + ($(window).height() - bottomoffset - offset);
        if (to < st || to > stbottom) {
            var sto = to - offset;
            if (sto < 0) sto = 0;
            //console.log ("Scrolling to focus:")
            //console.log(sto);
            defer(function() {
                $.scrollTo(sto, {duration: 0});
            });
        }
    };

    //CAPTURE ESCAPE
    var keyUp = function(event) {
        switch (event.which) {
        case 27: //ESCAPE KEY
            $.a11y_focus();
            break;
        }
    };

    //CAPTURE SPACE
    var keyDown = function(event) {
        switch (event.which) {
        case 32:
            switch (event.target.tagName.toLowerCase()) {
            case "textarea": case "text":
                break;
            default: 
                //STOP SPACE FROM SCROLLING / SELECTING
                event.preventDefault();
                event.stopPropagation();
                //TURN SPACE INTO CLICK
                $(event.target).trigger("click");
                return;
            }
        case 13:
            if ($(event.target).is(tabIndexElements)) return;
            //STOP SPACE FROM SCROLLING / SELECTING
            event.preventDefault();
            event.stopPropagation();
            //TURN SPACE INTO CLICK
            $(event.target).trigger("click");
        }
    };

    //MAKES AN ELEMENT TABBABLE
    var makeTabbable = function($element) {
        if ($element.is(".sr-only")) return $element;
        $element.attr({
            "role": "region",
            "tabindex": 0,
        }).addClass("prevent-default").addClass("accessible-text-block");
        return $element;
    };

    //TURNS DOM ELEMENT CHILDREN INTO HTML STRING
    var flatten = function($element) {
        var rtn = "";
        for (var i = 0; i < $element[0].children.length; i++) {
            rtn += $element[0].children[i].outerHTML;
        }
        return rtn;
    };

    //REMOVES CHILD ELEMENTS FROM DOM NODE
    var removeChildNodes = function($element) {
        var childNodes = $element[0].childNodes.length;
        for (var i = childNodes - 1; i > -1 ; i--) {
            if ($element[0].childNodes[i].remove) $element[0].childNodes[i].remove();
            else if ($element[0].childNodes[i].removeNode) $element[0].childNodes[i].removeNode(true); //ie 11 fix
        }
        return $element;
    };

    //PERFORMS CALCULATIONS TO TURN DOM NODES + TEXT NODES INTO TABBABLE CONTENT
    var makeChildNodesAccessible = function ($element) {

        //CAPTURE DOMNODE CHILDREN
        var children = $element.children();

        //IF NO CHILDREN, ASSUME TEXT ONLY, WRAP IN SPAN TAG
        if (children.length === 0) {
            var textContent = $element.text();
            if (textContent.trim() === "") return $element;
            removeChildNodes($element);
            $element.append( makeTabbable($("<span>"+textContent+"</span>")) );
            return $element;
        }

        var styleChildCount = 0;
        for (var c = 0; c < children.length; c++) {
            if ($(children[c]).is(styleElements)) styleChildCount++;
        }
        if (styleChildCount === children.length) {
            return $("<span>").append(makeTabbable($element));
        }

        //SEARCH FOR TEXT ONLY NODES AND MAKE TABBABLE
        var newChildren = [];
        for (var i = 0; i < $element[0].childNodes.length; i++) {
            var child = $element[0].childNodes[i];
            var cloneChild = $(child.outerHTML)[0];
            switch(child.nodeType) {
            case 3: //TEXT NODE
                newChildren.push( makeTabbable($("<span>"+child.nodeValue+"</span>")) );
                break;
            case 1: //DOM NODE
                var $child = $(cloneChild);
                if ($child.is(styleElements) || $child.is(ignoreElements)) {
                    newChildren.push( $child );
                } else {
                    var childChildren = $child.children();
                    if (childChildren.length === 0) {
                        //DO NOT DESCEND INTO TEXT ONLY NODES
                        var textContent = $child.text();
                        if (textContent.trim() !== "") makeTabbable($child);
                    } else {
                        
                        //DESCEND INTO NODES WITH CHILDREN
                        makeChildNodesAccessible($child);
                    }
                    newChildren.push( $child );
                }
                break;
            }
        }

        removeChildNodes($element);
        $element.append(newChildren);

        return $element;
    };

    //PERFORMS ABOVE FUNCTION TO EITHER TEXT STRING OR HTML STRING
    var makeAccessible = function(element) {
        var $element;
        // CONVERT ELEMENT TO DOM NODE
        try {
            $element = $("<div>"+element+"</div>");
        } catch (e) {
            throw e;
        }
        return flatten( makeChildNodesAccessible($element) );
    };

    var reattachFocusGuard = function() {
        var focusguard = $('#a11y-focusguard');
        focusguard.remove().appendTo($('body')).attr("tabindex", 0);
        focusguard.off("click").off("focus");
        focusguard
        .on("click", function(event) {
            alert("click");
            event.preventDefault();
            event.stopPropagation();
            $.a11y_focus(true);
        }).attr("tabindex", 0)
        focusguard.on("focus", function(event) {
            event.preventDefault();
            event.stopPropagation();
            $.a11y_focus(true);
        });
    };


    var focusOrNext = function($element) {
        if(!$element.is(focusableElementsFilter)) $element = $element.next(focusableElements);
        $element.focusNoScroll();
    };

    //TURN ON ACCESSIBILITY FEATURES
    $.a11y = function(isOn, options) {
        if (typeof isOn === "function") return;
        isOn = isOn === undefined ? true : isOn;
        if (options !== undefined) {
            $.extend($.a11y.options, options);
        }

        //STOP ELEMENTS WITH .not-accessible CLASS FROM BEING IN TAB INDEX
        $(".not-accessible[tabindex='0'], .not-accessible [tabindex='0']").attr({
            "tabindex": "-1",
            "aria-hidden": true
        }).addClass("aria-hidden");

        if ($.a11y.isOn !== isOn) {
            $.a11y.isOn = isOn;
            if (isOn) {
                //ADDS TAB GUARD, CLICK ON ACCESSIBLE TEXT AND SCROLL TO FOCUS EVENT HANDLERS
                $(window)
                .on("keyup", keyUp)
                .on("keydown", keyDown);
                $("body")
                .on("click", ".prevent-default", preventDefault)
                .on("focus", tabIndexElements, scrollToFocus)
                if ($("#a11y-focusguard").length === 0) $('body').append($('<a id="a11y-focusguard" class="a11y-freeze a11y-no-focus" tabindex="0" role="button"></a>'))
                if ($("#a11y-selected").length === 0) $('body').append($('<a id="a11y-selected" href="#" role="alert" class="prevent-default a11y-freeze" tabindex="-1">'))
            } else {
                //REMOVES TAB GUARD, CLICK ON ACCESSIBLE TEXT AND SCROLL TO FOCUS EVENT HANDLERS
                $(window)
                .off("keyup", keyUp)
                .off("keydown", keyDown);
                $("body")
                .off("click", ".prevent-default", preventDefault)
                .off("focus", tabIndexElements, scrollToFocus);
                $('#a11y-focusguard').remove();
                $('#ally-selected').remove();

            }
        }

        if ($.a11y.isOn) {
            $("#a11y-selected").focusNoScroll();
            $("body").a11y_aria_label(true);
            //ADDS TAB GUARG EVENT HANDLER
            reattachFocusGuard();
        }
    };
    $.a11y.isOn = false;
    $.a11y.options = {
        offsetTop: 0,
        offsetBottom: 0,
        animateDuration: 250,
        OS: "",
        isOn: false
    };
    $.a11y.focusStack = [];

//TOGGLE ACCESSIBILITY
    //MAKES CHILDREN ACCESSIBLE OR NOT
    $.a11y_on = function(isOn) {
        if (isOn === undefined) isOn = true;
        if (isOn === false) {
            $('body').attr("aria-hidden", true);
            $.a11y.options.isOn = false;
        } else {
            $('body').removeAttr("aria-hidden");
            $.a11y.options.isOn = true;
        }
    };

    $.fn.a11y_on = function(isOn) {
        isOn = isOn === undefined ? true : isOn;
        this.find(tabIndexElements).filter(tabIndexElementFilter).a11y_cntrl(isOn);
        return this;
    };


//MAKE ACCESSIBLE CONTROLS

    
    //MAKES NAVIGATION CONTROLS ACCESSIBLE OR NOT WITH OPTIONAL DISABLE CLASS AND ATTRIBUTE
    $.fn.a11y_cntrl = function(enabled, withDisabled) {
        enabled = enabled === undefined ? true : enabled;
        for (var i = 0; i < this.length; i++) {
            var $item = $(this[i]);
            if (enabled) {
                $item.attr({
                    tabindex: "0",
                }).removeAttr("aria-hidden").removeClass("aria-hidden").parents().removeAttr("aria-hidden").removeClass("aria-hidden");
                if (withDisabled) {
                    $item.removeAttr("disabled").removeClass("disabled");
                }
            } else {
                $item.attr({
                    tabindex: "-1",
                    "aria-hidden": "true"
                }).addClass("aria-hidden");
                if (withDisabled) {
                    $item.attr("disabled","disabled").addClass("disabled");
                }
            }
        }
        return this;
    };

    //MAKES NAVIGATION CONTROLS ACCESSIBLE OR NOT WITH DISABLE CLASS AND ATTRIBUTE
    $.fn.a11y_cntrl_enabled = function(enabled) {
        return this.a11y_cntrl(enabled, true);
    };

  
//MAKE ACCESSIBLE TEXT

    $.a11y_normalize = function(text) {
        var text = $("<div>" + text + "</div>").text();
        text = text.replace(htmlCharRegex,"");
        return text;
    }

    //CONVERTS HTML OR TEXT STRING TO ACCESSIBLE HTML STRING
    $.a11y_text = function (text) {
        return makeAccessible(text);
    };

    //CONVERTS DOM NODE TEXT TO ACCESSIBLE DOM NODES
    $.fn.a11y_text = function() {
        for (var i = 0; i < this.length; i++) {
            this[i].innerHTML = makeAccessible(this[i].innerHTML);
        }
        return this;
    };



//MAKE SELECTED

    $.fn.a11y_selected = function(isOn) {
        if (this.length === 0) return this;
        if (isOn === undefined) isOn = true;
        if (isOn) {
            var selected = $(this[0]);
            switch ($.a11y.options.OS) {
            case "mac":
                $("#a11y-selected").focusNoScroll();
                _.delay(function() {
                    selected.prepend($("<span class='a11y-selected aria-label'>selected </span>"))
                    $(selected).focusNoScroll();
                },250);
                break;
            default:
                $.a11y_alert("selected " + selected.text());
                selected.attr( "aria-label", "selected " + selected.text()).addClass("a11y-selected");
                break;
            }
        } else {
            switch ($.a11y.options.OS) {
            case "mac":
                for (var i = 0; i < this.length; i++) {
                    $(this[i]).find(".a11y-selected").remove()
                }
                break;
            default:
                for (var i = 0; i < this.length; i++) {
                    if ($(this[i]).is(".a11y-selected")) $(this[i]).removeClass("a11y-selected").removeAttr("aria-label");
                    $(this[i]).find(".a11y-selected").removeClass("a11y-selected").removeAttr("aria-label");
                }
            }
        }
    };


//FOCUS RESTRICTION

    //ALLOWS FOCUS ON SELECTED ELEMENTS ONLY
    $.fn.a11y_only = function(container) {
        var $elements;
        if (container !== undefined) $elements = $(container).find(tabIndexElements).filter(tabIndexElementFilter);
        else $elements = $(tabIndexElements).filter(tabIndexElementFilter);
        $elements.each(function(index, item) {
            var $item = $(item);
            if (item._a11y === undefined) item._a11y = [];
            item._a11y.push( $item.attr('tabindex') || 0 );
            $item.attr({
                'tabindex': -1,
                'aria-hidden': true
            }).addClass("aria-hidden");
        });
        this.find(tabIndexElements).filter(tabIndexElementFilter).attr({
            'tabindex': 0
        }).removeAttr('aria-hidden').removeClass("aria-hidden").parents().removeAttr('aria-hidden').removeClass("aria-hidden");

        //$.a11y_focus();
        return this;
    };

    //ALLOWS RESTORATIVE FOCUS ON SELECTED ELEMENTS ONLY
    $.fn.a11y_popup = function() {
        var $activeElement = $activeElementProxy;
        //console.log("Popup focus from");
        //console.log($activeElementProxy)
        $.a11y.focusStack.push($activeElement);

        this.a11y_only();
        
        //$.a11y_focus();

        if (this.length > 0) scrollToFocus({target: this[0] });

        reattachFocusGuard();
        return this;
    };

    //RESTORES FOCUS TO PREVIOUS STATE AFTER a11y_popup
    $.a11y_popdown = function() {
        $(tabIndexElements).filter(tabIndexElementFilter).each(function(index, item) {
            var $item = $(item);
            var pti = 0;
            if (item._a11y !== undefined && item._a11y.length !== 0) pti = parseInt(item._a11y.pop());
            $item.attr({
                'tabindex': pti
            })
            if (pti === -1) $item.attr('aria-hidden', true).addClass("aria-hidden");
            else $item.removeAttr('aria-hidden').removeClass("aria-hidden");;
        });

        var $activeElement = $.a11y.focusStack.pop();

        if ($activeElement) {
            focusOrNext($activeElement);
            scrollToFocus({target: $activeElement[0] });
        } else {
            $.a11y_focus();
        }

        reattachFocusGuard();
    };


//SET FOCUS


    //FOCUSES ON FIRST TABBABLE ELEMENT
    $.a11y_focus = function(dontDefer) {
        //IF HAS ACCESSIBILITY, FOCUS ON FIRST VISIBLE TAB INDEX
        if (dontDefer) {
            var tags = $(focusableElements);
            if (tags.length > 0) {
                focusOrNext($(tags[0]));
            }
            return true;
        }
        defer(function(){
            var tags = $(focusableElements);
            if (tags.length > 0) {
                focusOrNext($(tags[0]));
            }
        });
        //SCROLL TO TOP IF NOT POPUPS ARE OPEN
        return true;
    };

    //FOCUSES ON FIRST TABBABLE ELEMENT IN SELECTION
    $.fn.a11y_focus = function() {
        if (this.length === 0) return this;
        //IF HAS ACCESSIBILITY, FOCUS ON FIRST VISIBLE TAB INDEX
        defer(function(){
            var $this = $(this[0]);
            if ($this.is(focusableElements)) {
                focusOrNext($this);
            } else {
                var tags = $this.find(focusableElements);
                focusOrNext($(tags[0]));
            }
        }, this);
        return this;
    };


    //jQuery function to focus with no scroll (accessibility requirement for control focus)
    $.fn.focusNoScroll = function(){
        var y = $(window).scrollTop();
        if (this.length > 0) this[0].focus();
        window.scrollTo(null, y);
        return this; //chainability
    };


//CONVERT ARIA LABELS


    //TURNS aria-label ATTRIBUTES INTO SPAN TAGS
    $.fn.a11y_aria_label = function(deep) {
        if (!$.a11y.isOn) return this;
        var ariaLabels = [];

        for (var i = 0; i < this.length; i++) {
            var $item = $(this[i]);
            if ($item.is(ariaLabelElements)) ariaLabels.push(this[i]);
            if (deep === true) {
                var children = $item.find(ariaLabelElements);
                ariaLabels = ariaLabels.concat(children.toArray());
            }
        }

        if (ariaLabels.length === 0) return true;
        for (var i = 0; i < ariaLabels.length; i++) {
            var $item = $(ariaLabels[i]);
            var children = $item.children();
            if (children.length === 0) continue;
            if ($(children[0]).is(".aria-label")) continue;
            if ($item.attr("aria-label") == "") {
                $item.removeAttr("role").removeAttr("aria-label").removeAttr("tabindex").removeClass("aria-hidden");
                continue;
            }
            var sudoElement = $("<a class='aria-label prevent-default' tabindex='0' role='region'>");
            sudoElement.on("click", preventDefault);
            sudoElement.html($item.attr("aria-label"));
            $item.prepend(sudoElement);
            $item.removeAttr("role").removeAttr("aria-label").removeAttr("tabindex").removeClass("aria-hidden");
        }

        return this;
    };

});
