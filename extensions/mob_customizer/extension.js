/* **************************************************************

   Copyright 2013 Zoovy, Inc.

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.

************************************************************** */



//    !!! ->   TODO: replace 'username' in the line below with the merchants username.     <- !!!

var mob_customizer = function() {
	var r = {

////////////////////////////////////   VARS   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
	
	vars : {
		templatePath : "extensions/mob_customizer/templates.html",
		templates : []
		}

////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

	callbacks : {
		init : {
			onSuccess : function()	{
				var r = false; 

				app.model.fetchNLoadTemplates(app.vars.baseURL + app.ext.mob_customizer.vars.templatePath, app.ext.mob_customizer.vars.templates);
				app.rq.push(['myRIA', 'pageHandler', 'category', '.customizer', 'categoryTemplateMOBCustomizer', 'mob_customizer', 1]);
				
				r = true;
				
				return r;
				},
			onError : function()	{
				app.u.dump('BEGIN mob_customizer.callbacks.init.onError');
				}
			}
		}, //callbacks



////////////////////////////////////   ACTION [a]    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		a : {
			show360Viewer : function(url) {
				var fullURL = url; //make sure the url has a protocol. helps for local testing and native apps.
				var protocol = location.protocol == 'https:' ? 'https:' : 'http:'; //default protocol to use. will be overridden if https
				if(url.indexOf('//') === 0)  {
					fullURL = protocol+url;
					}
				$('<div>').attr('title','360 viewer').dialog({modal:true,width:610,height:670}).html("<iframe src="+fullURL+" width='610' height='670' />");
				return true;
				}
			}, //a [actions]

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		renderFormats : {
			view360inModal : function($tag,data)  {
				$tag.removeClass('displayNone').addClass('pointer');
				$tag.click(function(){
					app.ext.mob_customizer.actions.show360Viewer(data.value);
					});
				} //view360inModal

			}, //renderFormats

////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		u : {
			}, //u [utilities]

////////////////////////////////////  APP EVENTS [e]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		e : {
			} //e [app Events]
		} //r object.
	return r;
	}