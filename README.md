jquery.a11y
============


JQuery General Accessibility Plugin  

###Quick ref
```
ENABLE:  
a11y(enabled, options);
a11y.options = {
	offsetTop: 0,
	offsetBottom: 0,
	animateDuration: 250
};
  
MAKE ACCESSIBLE:  
a11y_cntrl_enabled(enabled);
a11y_cntrl(enabled, withDisabled);
a11y_on(enabled);
a11y_text(text);

READ TEXT:
a11y_alert(text);
  
FOCUS RESTRICTION:  
a11y_only();
a11y_popup();
a11y_popdown();
  
SET FOCUS:  
focusNoScroll();
a11y_focus();
  
CONVERT ARIA LABELS:    
a11y_aria_label(deep);
````
  
###Functional Descriptions
  
```
<style id='a11y'>
a.aria-label {
	position:absolute;
	left:0px;
	width:auto;
	height:auto;
	overflow:auto;
	color: rgba(0,0,0,0) !important;
	background: rgba(0,0,0,0) !important;
	font-size: 1px !important;
}
</style>style>

```
Adds above to document head  
  
  
```
$.a11y(enabled, options);
$.a11y.options = {
	offsetTop: 0,
	offsetBottom: 0,
	animateDuration: 250
};
```
Use the above code to turn on accessibilty.  
* Hides everything with '.not-accessible' by adding tabindex="-1" aria-hidden="true"  
* Redirects '.prevent-default' clicks to event.preventDefault();  
* Animates scrolls for '[tabindex="0"]' focuses (offsetTop and offsetBottom ensure visibility)  
* Appends focusguard to body to capture end of page focus  
* Redirects body clicks to last element with focus  
  
  

```
$.a11y_focus();
$('selector').a11y_focus();
```
Use the above code to focus on the first tabbable element   
* Focuses on first occurance of '[tabindex]:visible:not([tabindex="-1"])'  
  
  

```
$('selector').a11y_aria_label(deep);
```
Use the above code to make aria-labels readable on a touchscreen  
* Applies to 'div[aria-label], span[aria-label]'  
* Creates '&lt;a class="aria-label prevent-default" role="region" href="#"&gt;' as first child of selected  
  
  

```
$('selector').a11y_cntrl(enabled, withDisabled)
$('selector').a11y_cntrl_enabled(enabled)
```
Use the above to toggle selection of controls  
* Adds tabindex="0"  
* Removes aria-hidden from parent tree   
* If withDisabled will also add+remove 'disabled' attribute and class
* $('selector').a11y_cntrl_enabled(enabled) is a shortcut for $('selector').a11y_cntrl(enabled, true) 
  
  
```
$('selector').a11y_on(enabled)
```
Use the above to toggle selection of tab indexes on children  
* Performs a11y_cntrl(enabled) on all focusable elements in selector
  
  
  
  
  
```
$.a11y_text(text)
$.a11y_text(htmlstring)
```
Use the above to make html/text string into tabbable html string  
  
   
```
$.a11y_alert(text)
```
Make screen reader read text as alert using [role="alert"]  
  

```
$('selector').a11y_text()
```
Use the above to make selected elements html/text into tabbable html  
* Ignores 'a, button, input, select, textarea'  
* Ignores 'b, br, i, abbr, strong'  
* Wraps text nodes in '&lt;span tabindex="0" role="region"&gt;&lt;/span&gt;' or adds [tabindex="0"][role="region"] to parent    
  
  
```
$('selector').a11y_only()
```
Use above to restrict tabbable / readable focus to selected elements  
  
  
```
$('selector').a11y_popup()
```
Use above to restrict tabbable / readable focus to selected elements, undo with function below  
  
  
```
$.a11y_popdown()
```
Use above to relax a11y_popup restriction  
  
    
