// JavaScript Document
function clearText(thefield)
{
	if (thefield.defaultValue == thefield.value)
	{
		thefield.value = ""
	}
}

/* clear value */
function clearval(txtval,thefield)
{
	if(thefield.defaultValue == txtval)
	{
		thefield.value = '';
	}
}

/* restore value */
function restoreval(txtval,thefield)
{
	if(thefield.value == '')
	{
		thefield.value = txtval;
	}
}

function openWindow(url,w,h) 
{
	adviceWin = window.open(url,'advice','status=no,width='+w+',height='+h+',menubar=no,scrollbars=yes');
	adviceWin.focus(true);
}
function zoom (url) 
{
	z = window.open('','zoom_popUp','status=0,directories=0,toolbar=0,menubar=0,resizable=1,scrollbars=1,location=0');
	z.document.write('<html>\n<head>\n<title>Picture Zoom</title>\n</head>\n<body>\n<div align="center">\n<img src="' + url + '"><br>\n<form><input type="button" value="Close Window" onClick="self.close(true)"></form>\n</div>\n</body>\n</html>\n');
	z.document.close();
	z.focus(true);
}
