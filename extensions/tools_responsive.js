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


var tools_responsive = function() {
	var r = {

////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

	callbacks : {
		init : {
			onSuccess : function()	{
				var r = false; 

				r = true;
				return r;
				},
			onError : function()	{
				app.u.dump('BEGIN admin_orders.callbacks.init.onError');
				}
			}
		}, //callbacks



////////////////////////////////////   ACTIONS [a]    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		a : {

			}, //a [actions]

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		renderFormats : {

			}, //renderFormats

///////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		u : {
			getDipsWidth  : function(){},
			getDipsHeight : function(){}
			}, //u [utilities]

///////////////////////////////////   EVENTS [e]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		e : {
			} //e [app Events]
		} //r object.
	return r;
	}