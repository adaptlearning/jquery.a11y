jquery.a11y
============


JQuery General Accessibility Plugin  


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
* Hide everything with '.not-accessible' by adding tabindex="-1" aria-hidden="true"  
* Redirect '.prevent-default' clicks to event.preventDefault();  
* Animate scrolls for '[tabindex="0"]' focuses (offsetTop and offsetBottom ensure visibility)  
* Append focusguard to body to capture end of page focus  
* Redirect body clicks to last element with focus  


```
$.a11y_focus_first();
```
Use the above code to focus on the first tabbable element   
* First occurance of '[tabindex]:visible:not([tabindex="-1"])'  


```
$('selector').a11y_aria_label(deep);
```
Use the above code to make aria-labels readable on a touchscreen  
* Applies to 'div[aria-label], span[aria-label]'  
* Creates '&gt;a class="aria-label prevent-default" role="region" href="#"&lt;' as first child of selected  


```
$('selector').a11y_cntrl(enabled)
```
Use the above to toggle selection of controls  
* Adds tabindex="0"  
* Removes aria-hidden from parent tree   

```
$.a11y_text(text)
```
Use the above to make html/text into tabbable html  

```
$('selector').a11y_text()
```
Use the above to make selected elements html/text into tabbable html  
* Ignores 'a, button, input, select, textarea'  
* Ignores 'b, br, i, abbr, strong'  
* Wraps text nodes in '<span tabindex="0" role="region"></span>' or adds '[tabindex="0"][role="region"] to parent'  

```
$('selector').a11y_popup()
```
Use above to restrict tabbable / readable focus to selected elements  

```
$.a11y_popdown()
```
Use above to relax a11y_popup restriction  
