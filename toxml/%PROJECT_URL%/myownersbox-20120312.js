/* **************************************************************

   Copyright 2011 Zoovy, Inc.

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


var myownersboxRIA = function() {
	var r = {
		
	vars : {
//a list of the templates used by this extension.
//if this is a custom extension and you are loading system extensions (prodlist, etc), then load ALL templates you'll need here.
		"templates" : ['productTemplate','mpControlSpec','categoryTemplate','categoryPageTemplate','prodViewerTemplate','cartViewer','cartViewerProductTemplate','prodReviewSummaryTemplate','productChildrenTemplate','prodReviewsTemplate','reviewFrmTemplate','subscribeFormTemplate','categoryThumbTemplate','orderLineItemTemplate','orderContentsTemplate','cartSummaryTemplate','orderProductLineItemTemplate','helpTemplate','customerTemplate','productDetailedTemplate','homepageTemplate','configuratorTemplate'],
		"user" : {
			"recentSearches" : [],
			},
		"dependAttempts" : 0,  //used to count how many times loading the dependencies has been attempted.
		"dependencies" : ['store_prodlist','store_navcats','store_product','store_search','store_cart','store_crm'] //a list of other extensions (just the namespace) that are required for this one to load
		},


					////////////////////////////////////   CALLS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\		



	calls : {

		}, //calls




					////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\





	callbacks : {
		init : {
			onSuccess : function()	{
				var r = true; //return false if extension won't load for some reason (account config, dependencies, etc).
				return r;
				},
			onError : function()	{
//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
//you may or may not need it.
				myControl.util.dump('BEGIN myControl.ext.myownersboxRIA.callbacks.init.onError');
				}
			},

		startMyProgram : {
			onSuccess : function()	{
//attach an event to the window that will execute code on 'back' some history has been added to the history.
				window.onpopstate = function(event) { 
					myControl.ext.myownersboxRIA.util.handlePopState(event.state);
					}; 


//				myControl.util.dump('BEGIN myControl.ext.myownersboxRIA.callbacks.startMyProgram.onSuccess');
//go get the root level categories, then show them using showCategories callback.
				myControl.ext.store_navcats.calls.categoryTree.init(); //{"callback":"loadHomepageContent","extension":"myownersboxRIA"}
				myControl.ext.myownersboxRIA.util.handleLegacyURL(); //checks url and will load appropriate page content.
//get some info to have handy for when needed (cart, profile, etc)
				myControl.calls.getProfile.init(myControl.vars.profile,{"callback":"haveProfileData","extension":"myownersboxRIA"});
				myControl.ext.store_cart.calls.getCartContents.init({},'mutable');
				myControl.ext.store_cart.calls.getShippingRates.init({},'mutable');
				if(myControl.vars.cid)	{
					myControl.util.dump(" -> customerid: "+myControl.vars.cid);
					myControl.ext.store_crm.calls.getCustomerList.init('forgetme',{'callback':'handleForgetmeList','extension':'store_prodlist'},'mutable');
					}

				myControl.model.dispatchThis();

//if a catalog is specified, bind a keyword autocomplete to the search form.
				if($('#headerCatalog').val() != '')	{
					myControl.ext.store_search.util.bindKeywordAutoComplete('headerSearchFrm');
					}

//adds submit functionality to search form. keeps dom clean to do it here.
				$('#headerSearchFrm').submit(function(){
					myControl.ext.store_search.calls.searchResult.init($(this).serializeJSON(),{'callback':'showResults','extension':'myownersboxRIA'});
					// DO NOT empty altSearchesLis here. wreaks havoc.
					myControl.model.dispatchThis();
					$(".ui-dialog-content").dialog("close"); //close any open dialogs. needs to happen when a wiki link is clicked from a modal
					return false;
					});
					
				$('#headerSearchFrmSubmit').removeAttr('disabled');
				var authState = myControl.sharedCheckoutUtilities.determineAuthentication();
				
				if(authState && (authState == 'authenticated' || authState == 'thirdPartyGuest'))	{
					myControl.util.dump("App thinks user is authenticated: "+authState);
					myControl.ext.myownersboxRIA.util.userIsLoggedIn();
					}
				myControl.ext.myownersboxRIA.util.bindNav();  //only add this once or click events will get duplicated each time it's run.

				$('#cartBtn').removeAttr('disabled');
				},
			onError : function(d)	{
				$('#globalMessaging').append(myControl.util.getResponseErrors(d)).toggle(true);
				}
			},



/*
Currently, this is executed on a ping.  a utility handles generating all the requests
for each xsell pid, then this call back handles the display of all lists.

for the lists, only execute build if there are product in attibute. more efficient this way.
a show is added to the parent container in case the element is hidden by default.
the element is emptied and removed if no product are specified, to drop any titles or placeholder content.

*/

		displayXsell : 	{
			onSuccess : function(tagObj)	{
				var data = myControl.data[tagObj.datapointer]; //shorter reference.
				if(data['%attribs']['zoovy:grp_children'])	{
					myControl.ext.store_prodlist.util.buildProductList({"templateID":"productChildrenTemplate","parentID":"prodlistChildren","csv":data['%attribs']['zoovy:grp_children']});
					}

				if(data['%attribs']['zoovy:related_products'])	{
					$('#prodlistRelatedContainer').show().width($('#product-modal').width()-60); //Carousel wanted a fixed width container
					myControl.ext.store_prodlist.util.buildProductList({"templateID":"productTemplate","parentID":"prodlistRelated","csv":data['%attribs']['zoovy:related_products']});
					$('#prodlistRelated').jcarousel();
					}
				else	{
					$('#prodlistRelatedContainer').empty().remove();
					}
				

				if(data['%attribs']['zoovy:accessory_products'])	{
					$('#prodlistAccessoriesContainer').show();
					myControl.ext.store_prodlist.util.buildProductList({"templateID":"productTemplate","parentID":"prodlistAccessories","csv":data['%attribs']['zoovy:accessory_products']});
					}
				else	{
					$('#prodlistAccessoriesContainer').empty().remove();
					}
				
				myControl.ext.store_product.util.showReviewSummary({"pid":data.pid,"templateID":"prodReviewSummaryTemplate","parentID":"prodViewerReviewSummary"});
				myControl.ext.store_product.util.showReviews({"pid":data.pid,"templateID":"prodReviewsTemplate","parentID":"prodViewerReviews"});			
				myControl.model.dispatchThis();
				},
			onError : function(d)	{
				$('#globalMessaging').prepend(myControl.util.getResponseErrors(d)).toggle(true);
				}
			},
			
			
		showProd : 	{
			onSuccess : function(tagObj)	{
//				myControl.util.dump("BEGIN proximis.callbacks.showProd");
//				myControl.util.dump(tagObj);
				myControl.renderFunctions.translateTemplate(myControl.data[tagObj.datapointer],tagObj.parentID);

				$( "#tabbedProductContent" ).tabs();
//the mutable q is used here because a callback is needed to execute the display on these prodlists.
				myControl.ext.store_product.util.getXsellForPID(myControl.data[tagObj.datapointer].pid,'mutable');
				myControl.calls.ping.init({"callback":"displayXsell","extension":"myownersboxRIA","datapointer":tagObj.datapointer});
				myControl.model.dispatchThis();


				},
			onError : function(d)	{
				$('#'+d.tagObj.parentID).prepend(myControl.util.getResponseErrors(d)).toggle(true);
				}
			},
		haveProfileData : {
			onSuccess : function(tagObj)	{
//				myControl.util.dump("BEGIN myownersboxRIA.callbacks.haveProfileData.onSuccess");
				$('#logo').empty().append(myControl.util.makeImage({'tag':1,'w':210,'h':155,'m':0,'name':myControl.data[tagObj.datapointer]['zoovy:company_logo'],'b':'tttttt'})).click(function(){
					myControl.ext.myownersboxRIA.util.showPage('.')
					});
				},
			onError : function(d)	{
//throw some messaging at the user.  since the categories should have appeared in the left col, that's where we'll add the messaging.
				$('#globalMessaging').append(myControl.util.getResponseErrors(d)).toggle(true);
				}
			}, //haveProfileData

//used on an add to cart post to update the qty in the cart button.
		cartQuantityChanged : {
			onSuccess : function(tagObj)	{
				myControl.util.dump("BEGIN myownersboxRIA.callbacks.cartQuantityChanged.onSuccess");
				var itemCount = myControl.util.isSet(myControl.data[tagObj.datapointer].cart['data.item_count']) ? 0 : myControl.data[tagObj.datapointer].cart['data.item_count']
				$('#cartBtn').removeAttr('disabled').text("Cart ("+itemCount+")");
				},
			onError : function(d)	{
//throw some messaging at the user.  since the categories should have appeared in the left col, that's where we'll add the messaging.
				$('#globalMessaging').append(myControl.util.getResponseErrors(d)).toggle(true);
				}
			}, //cartQuantityChanged

//executed when the cart is changed, such as a zip entered or a country selected.
		cartUpdated :	{
			onSuccess : function(tagObj)	{
				myControl.util.dump("BEGIN myownersboxRIA.callbacks.cartUpdated.onSuccess");
				myControl.ext.store_cart.util.showCartInModal(); 
				},
			onError : function(d)	{
//throw some messaging at the user.  since the categories should have appeared in the left col, that's where we'll add the messaging.
				$('#globalMessaging').append(myControl.util.getResponseErrors(d)).toggle(true);
				}
			},


		loadHomepageContent : {
			onSuccess : function()	{
//				myControl.util.dump('BEGIN myControl.ext.myownersboxRIA.callbacks.showCategories.onSuccess');
				myControl.ext.myownersboxRIA.util.showPage('.'); //put homepage content into body.
				},
			onError : function(d)	{
//throw some messaging at the user.  since the categories should have appeared in the left col, that's where we'll add the messaging.
				$('#leftCol').append(myControl.util.getResponseErrors(d)).toggle(true);
				}
			}, //loadHomepageContent
			
		showPageContent : {
			onSuccess : function(tagObj)	{
				var catSafeID = tagObj.datapointer.split('|')[1];
				myControl.renderFunctions.translateTemplate(myControl.data['categoryDetail|'+catSafeID],'page-'+catSafeID);
				
				if(typeof myControl.data['categoryDetail|'+catSafeID]['@subcategoryDetail'] == 'object')	{
					myControl.ext.store_navcats.util.getChildDataOf(catSafeID,{'parentID':'subcategoryListContainer','callback':'addCatToDom','templateID':'categoryThumbTemplate','extension':'store_navcats'},'categoryDetailMax');
					}
				else	{
//no subcategories are present. do something else or perhaps to nothing at all.
					}
				myControl.ext.store_prodlist.util.buildProductList({"templateID":"productTemplate","parentID":"productListContainer","items_per_page":20,"csv":myControl.data[tagObj.datapointer]['@products']});
				myControl.model.dispatchThis();
				//don't show the breadcrumb on the homepage.				
				if(catSafeID != '.'){myControl.ext.myownersboxRIA.util.breadcrumb(catSafeID)}

/*	
$("#productListContainer li").hover(
	function () {
		$(this).append($("<span class='plIconList'>I C O N S</span>"));
	}, 
	function () {
//$(this).find("span:last").remove();
//remove all instances of plIconList. will include instances open in any additional lists that are present.
		$(this).find(".plIconList").remove();
	}
);
*/				$('#mainContentArea').removeClass('loadingBG');
				},
			onError : function(d)	{
				$('#mainContentArea').removeClass('loadingBG').append(myControl.util.getResponseErrors(d)).toggle(true);
				}
			}, //showPageContent

//this used anymore???
		showList : {
			onSuccess : function(tagObj)	{
				myControl.util.dump('BEGIN myControl.ext.myownersboxRIA.showList.onSuccess ');
				var listID = tagObj.datapointer.split('|')[1];
				var prods = myControl.ext.store_crm.util.getSkusFromList(listID);
				if(prods.length < 1)	{
//list is empty.
					myControl.util.formatMessage('This list ('+listID+') appears to be empty.');
					}
				else	{
					myControl.util.dump(prods);
					myControl.ext.store_prodlist.util.buildProductList({"templateID":"productTemplate","parentID":tagObj.parentID,"csv":prods})
					myControl.model.dispatchThis();
					}
				},
			onError : function(d)	{
				myControl.util.dump('BEGIN myControl.ext.store_crm.callbacks.init.onError');
				$('#'+d['_rtag'].parentID).prepend(myControl.util.getResponseErrors(d)).toggle(true);
				}
			}, //showList


		authenticateThirdParty : {
			onSuccess : function(tagObj)	{
				myControl.ext.myownersboxRIA.util.userIsLoggedIn();
				},
			onError : function(d)	{
				myControl.util.dump('BEGIN myControl.callbacks.authenticateThirdParty.onError');
				$('#globalMessaging').append(myControl.util.getResponseErrors(d)).toggle(true);
_gaq.push(['_trackEvent','Authentication','User Event','Authentication for third party failed']);
				}
			}, //authenticateThirdParty



		authenticateZoovyUser : {
			onSuccess : function(tagObj)	{
				myControl.util.dump('BEGIN myownersboxRIA.callbacks.authenticateZoovyUser.onSuccess');
//successful login.	
				myControl.vars.cid = myControl.data[tagObj.datapointer].cid; //save to a quickly referencable location.
				$('#loginSuccessContainer').show();
				$('#loginFormForModal').prepend("Thank you, you are now logged in.");
				$('#modalLoginForm').hide();
				

				myControl.ext.myownersboxRIA.util.userIsLoggedIn();
_gaq.push(['_trackEvent','Authentication','User Event','Logged in through Store']);
				},
			onError : function(d)	{
				myControl.util.dump('BEGIN myControl.ext.convertSessionToOrder.callbacks.authenticateZoovyUser.onError');
				$("#loginMessaging").show().append(myControl.util.formatMessage("It appears that username/password is invalid. Please try again or continue as a guest."));
_gaq.push(['_trackEvent','Authentication','User Event','Log in as Zoovy user attempt failed']);
				}	
			}, //authenticateZoovyUser

		updateSearchNav : {
			
			onSuccess : function(tagObj)	{
//				myControl.util.dump('BEGIN myownersboxRIA.callbacks.updateSearchNav.onSuccess');

				var keyword = tagObj.datapointer.split("|")[1];
				myControl.util.dump(" -> update search nav for = "+keyword);
				var o = "<li><a href='#' onClick=\"$('#headerKeywordsInput').val('"+keyword+"'); $('#headerSearchFrm').submit();\">"+keyword+" ("+myControl.data[tagObj.datapointer]['@products'].length+")<\/a><\/li>"
				myControl.util.dump(o);
				$('#altSearchesList').removeClass('loadingBG').append(o);
				},

			onError : function(d)	{
				myControl.util.dump('BEGIN myControl.ext.myownersboxRIA.callbacks.showResults.onError');
				$('#altSearchesList').removeClass('loadingBG')
				$('#searchNav').append(myControl.util.getResponseErrors(d)).toggle(true);
				}
			
			}, //updateSearchNav


		showResults :  {
			onSuccess : function(tagObj)	{
				myControl.util.dump('BEGIN myControl.ext.myownersboxRIA.callbacks.showResults.onSuccess');
				myControl.ext.myownersboxRIA.util.changeNavTo('search');
				var keywords = tagObj.datapointer.split('|')[1];
//recent searches should not contain duplicates.
				if($.inArray(keywords,myControl.ext.myownersboxRIA.vars.user.recentSearches) < 0)
					myControl.ext.myownersboxRIA.vars.user.recentSearches.push(keywords);
				$('#altSearchesList').empty(); //clear existing 'alternative searches'
//				myControl.util.dump(' -> altSearchList emptied.');
				if(myControl.data[tagObj.datapointer]['@products'].length == 0)	{
					$('#mainContentArea').empty().append("Zero items matched your search.  Please try again.");
					}
				else	{
					
//need a ul for the product list to live in.
					$('#mainContentArea').empty().append("<ul id='productListContainer' class='prodlist' \/>");
//will handle building a template for each pid and tranlating it once the data is available.
//returns # of requests needed. so if 0 is returned, no need to dispatch.
					myControl.ext.store_prodlist.util.buildProductList({"templateID":"productTemplate","parentID":"productListContainer","emptyListMessage":"Zero items matched your search. Please try again.","items_per_page":20,"csv":myControl.data[tagObj.datapointer]['@products']})
					}

//whether the search had results or not, if more than 1 keyword was searched for, provide a breakdown for each permutation.
				var keywords = tagObj.datapointer.split('|')[1];
				if(keywords.split(' ').length > 1)	{
					$('#altSearchesContainer').show();
//					myControl.util.dump(" -> more than 1 keyword was searched for.");
					$('#altSearchesList').addClass('loadingBG');
					myControl.ext.store_search.util.getAlternativeQueries(keywords,{"callback":"updateSearchNav","extension":"myownersboxRIA"});
					}
				else	{
					$('#altSearchesContainer').hide();
					}
				myControl.ext.myownersboxRIA.util.showRecentSearches();
				myControl.model.dispatchThis(); // will dispatch requests for product and/or requests for alternative queries.
				},
			onError : function(d)	{
				myControl.util.dump('BEGIN myControl.ext.myownersboxRIA.callbacks.showResults.onError');
				$('#mainContentArea').removeClass('loadingBG').append(myControl.util.getResponseErrors(d)).toggle(true);
				}
			}
		}, //callbacks




////////////////////////////////////   WIKILINKFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

/*
the wiki translator has defaults for the links built in. however, these will most likely
need to be customized on a per-ria basis.
*/
		wiki : {
			":search" : function(suffix,phrase){
				return "<a href='#' onClick=\"$('#headerKeywordsInput').val('"+suffix+"'); $('#headerSearchFrm').submit(); \">"+phrase+"<\/a>"
				},
			":category" : function(suffix,phrase){
				return "<a href='#' onClick='myControl.ext.myownersboxRIA.util.showPage(\""+suffix+"\")'>"+phrase+"<\/a>"
				},
			":product" : function(suffix,phrase){
				return "<a href='#' onClick='myControl.ext.myownersboxRIA.util.showProd(\""+suffix+"\")'>"+phrase+"<\/a>"
				},
			":customer" : function(suffix,phrase){
// ### this needs to get smarter. look at what the suffix is and handle cases. (for orders, link to orders, newsletter link to newsletter, etc)				
				return "<a href='#' onClick='myControl.ext.myownersboxRIA.util.changeNavTo(\"customer\")'>"+phrase+"<\/a>"
				}
			},




////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		renderFormats : {
			
//assumes that you have already gotten a 'max' detail for the safecat specified data.value.
			subcatList : function($tag,data)	{
//				myControl.util.dump("BEGIN store_navcats.renderFormats.subcatList");
				var catSafeID; //used in the loop for a short reference.
				var o = '';
				if(!$.isEmptyObject(myControl.data['categoryDetail|'+data.bindData.cleanValue]['@subcategoryDetail']))	{
					var L = myControl.data['categoryDetail|'+data.bindData.cleanValue]['@subcategoryDetail'].length;
					var size = L > 3 ? 3 : L; //don't show more than three.
//!!! hhhmm.. needs fixin. need to compensate 'i' for hidden categories.
					for(var i = 0; i < size; i +=1)	{
						if(myControl.data['categoryDetail|'+data.bindData.cleanValue]['@subcategoryDetail'][i].pretty[0] != '!')	{
							catSafeID = myControl.data['categoryDetail|'+data.bindData.cleanValue]['@subcategoryDetail'][i].id;
							o += "<li onClick=\"myControl.ext.myownersboxRIA.util.showPage('"+catSafeID+"');\"> &#187; "+myControl.data['categoryDetail|'+data.bindData.cleanValue]['@subcategoryDetail'][i].pretty;
							if(myControl.data['categoryDetail|'+data.bindData.cleanValue]['@subcategoryDetail'][i]['@products'].length > 0)
								o += " ("+myControl.data['categoryDetail|'+data.bindData.cleanValue]['@subcategoryDetail'][i]['@products'].length+" items)"
							o += "<\/li>";
							}
						}
					if(L > 3)	{
						o += "<li onClick=\"myControl.ext.myownersboxRIA.util.showPage('"+data.bindData.cleanValue+"');\">&#187; <b> View all "+L+" Categories<\/b><\/li>";
						}
					$tag.append(o);
					}		
				} //subcatList
			},


////////////////////////////////////   UTIL    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		util : {
			

//used to load page content based on legacy linking syntax.					
			handleLegacyURL : function()	{
				var pageType = this.whatPageTypeAmI(window.location.href);
// will return either the safe path or pid or something else useful
// hash.substring(0) will return everything preceding a #, if present.
				var pageInfo = this.giveMeRelevantInfoToPage(window.location.href); 
				this.handlePageContent(pageType,pageInfo);
				},

//loads page content. pass in a type: category, product, customer or help
// and a page info: catSafeID, sku, customer admin page (ex: newsletter) or 'returns' (respectively to the line above.
			handlePageContent : function(pageType,pageInfo)	{
				switch(pageType)	{
				case 'product':
					myControl.ext.myownersboxRIA.util.showProd(pageInfo);
					break;
				case 'category':
					myControl.ext.myownersboxRIA.util.showPage(pageInfo);
					break;
				case 'customer':
					myControl.ext.myownersboxRIA.util.changeNavTo('customer',pageInfo);
					break;
				case 'other':
//default to showing the homepage if page info is blank. that would mean giveMeRelevantInfoToPage retrned nothing useful.
					if(!myControl.util.isSet(pageInfo) || pageInfo == 'index.html')	{
						myControl.ext.myownersboxRIA.util.showPage('.');
						}
					else	{
						myControl.ext.myownersboxRIA.util.changeNavTo('help',pageInfo);
						}
//!!! this needs to get smarter. If we got here, probably a 'help' and should load
					break;
				default:
					//uh oh. what are we? default to homepage.
					myControl.ext.myownersboxRIA.util.showPage('.');
					}
				},


//determine from URL what the page type is. uses legacy zoovy syntax. (/category/.. or /product/...	
			whatPageTypeAmI : function(url)	{
				var r; //what is returned.
				if(!url)	{
					myControl.util.dump("no url specified for whatPageTypeAmI");
					}
				else if(url.indexOf('/product/') > 0)	{
					r = 'product'
					}
				else if(url.indexOf('/category/') > 0)	{
					r = 'category'
					}
				else if(url.indexOf('/customer/') > 0)	{
					r = 'customer'
					}
				else	{
					r = 'other'
					}
				myControl.util.dump("whatPageTypeAmI = "+r);
				return r;
				},


			giveMeRelevantInfoToPage : function(url)	{
				var r; //what is returned.
				
				url = url.substr(0, url.indexOf('#') || url.length); //strip off everything after hash (#)
				
				if(url.indexOf('/product/') > 0)	{
					r = url.split('/product/')[1]; //should be left with SKU or SKU/something_seo_friendly.html
					if(r.indexOf('/') > 0)	{r = r.split('/')[0];} //should be left with only SKU by this point.
					}
				else if(url.indexOf('/category/') > 0)	{
					r = url.split('/category/')[1]; //left with category.safe.id or category.safe.id/
					if(r.charAt(r.length-1) == '/')	{r = r.slice(0, -1)} //strip trailing /
					if(r.charAt(0) != '.')	{r = '.'+r}
					}
				else if(url.indexOf('/customer/') > 0)	{
					r = url.split('/customer/')[1]; //left with order_summary or order_summary/
					if(r.charAt(r.length-1) == '/')	{r = r.slice(0, -1)} //strip trailing /
					}
				else	{
				// url = www.something.com/returns.cgis or ...cgis?key=value
					var chunks = url.split('/');
					r = chunks[chunks.length -1]; //should be left with returns or returns.cgis potentially with ?urivars
					if(r.indexOf('?') > 0){r = r.split('?')[1]} //remove any uri vars.
					r = r.replace('.cgis');  // should be left with just returns
					}
				myControl.util.dump("giveMeRelevantInfoToPage = "+r);
				return r;
				},

//a generic function for guessing what type of object is being dealt with. Check for common params. ### not in use yet. 
			whatAmIFor : function(P)	{
				var r = false; //what is returned
				if(P.pid)	{r = 'product'}
				else if(P.catSafeID){r = 'category'}
				else if(P.path){ r = 'category'}
				else if(P.page && P.page.indexOf('/customer/') > 0)	{r = 'customer'}
				else if(P.page)	{r = 'help'}
				return r;
				},
//wanted to use 'whatAmIFor' here, but got stock on how to get the data needed into the pageInfo function. ### see if this can be addressed.
//https://developer.mozilla.org/en/DOM/window.onpopstate
			handlePopState : function(P)	{
				var pageType, pageInfo;
				if(P.pid)	{pageType = 'product'; pageInfo = P.pid}
				else if(P.catSafeID){pageType = 'category'; pageInfo = P.catSafeID}
				else if(P.path){ pageType = 'category'; pageInfo = P.path}
				else if(P.page && P.page.indexOf('/customer/') > 0)	{pageType = 'customer'; pageInfo = P.page}
				else if(P.page)	{pageType = 'help'; pageInfo = P.page}
				this.handlePageContent(pageType,pageInfo);
				},
			
//pass in the 'state' object. ex: {'pid':'somesku'} or 'catSafeID':'.some.safe.path'
//will add a pushstate to the browser for the back button and change the URL
//http://spoiledmilk.dk/blog/html5-changing-the-browser-url-without-refreshing-page

			addPushState : function(P)	{
				var title = 'myOwnersBox ';
				var relativePath;
				
				var pageType = this.whatAmIFor(P);
				
				switch(pageType)	{
				case 'product':
					title += P.pid
					relativePath = '/product/'+P.pid+'/';
					break;
				case 'category':
					title += P.catSafeID
					relativePath = '/category/'+P.catSafeID+'/';
					break;
				case 'customer':
					title = 'admin '+P.page+'/';
					relativePath = '/customer/'+P.page+'/';
					break;
				case 'other':
					title += P.page
					relativePath = '/'+P.page;
					break;
				default:
					//uh oh. what are we? default to homepage.
					myControl.ext.myownersboxRIA.util.showPage('.');
					}
				
				
				try	{
					window.history.pushState(P, title, relativePath);
					}
				catch(err)	{
					//Handle errors here
					}
				},
			
//rather than having all the params in the dom, just call this function. makes updating easier too.
			showProd : function(pid)	{
//				myControl.ext.store_product.util.prodDataInModal({'pid':pid,'templateID':'prodViewerTemplate',});
//nuke existing content and error messages.
				$('#globalMessaging').empty().hide(); 
				$('#mainContentArea').empty().append(myControl.renderFunctions.createTemplateInstance('prodViewerTemplate',"productViewer"));
				myControl.ext.store_product.calls.getReviews.init(pid);
				myControl.ext.store_product.calls.getProduct.init(pid,{'callback':'showProd','extension':'myownersboxRIA','parentID':'productViewer'});
				myControl.model.dispatchThis();
				this.addPushState({'pid':pid})
				},


//figures which nav tree is visible and returns the id. probably don't need this for this RIA.
			whichNavIsVisible : function()	{
				var r = ''; //this is what's returned.
				$('#leftCol nav').each(function(){
					if($(this).is(':visible'))	{
						r = $(this).attr('id');
						r = r.slice(0,r.length-3);//trims 'Nav' off the end.
						}
					});
				return r;
				},

			

			changeNavTo : function(newNav,article)	{
//				myControl.util.dump("BEGIN myownersboxRIA.util.changeNavTo ("+newNav+")");

				$(".ui-dialog-content").dialog("close");  //close any open dialogs. important cuz could get executed via wiki in a modal window.

//new nav is 'customer' or 'help'. search nav may or may not be supported for this RIA
				if(!newNav)	{myControl.util.dump("WARNING - nav type not specified for changeNavTo");}
				else if(newNav == 'search')	{
					}
				else if(newNav == 'checkout')	{
					$('#mainContentArea').empty(); //duh.
					$(".ui-dialog-content").dialog("close"); //close all modal windows.
					myControl.ext.convertSessionToOrder.calls.startCheckout.init('mainContentArea');
					}
				else if (newNav == 'help' || newNav == 'customer')	{
					$('#mainContentArea').empty().append(myControl.renderFunctions.transmogrify('mainContentArea_'+newNav,newNav+'Template',myControl.data['getProfile|'+myControl.vars.profile]))
					}
				else	{
//unknown nav.
myControl.util.dump("WARNING - unknown nav type ["+newNav+"] specified for changeNavTo");
					}
				

				},



			bindNav : function()	{
				
$('#leftCol nav a').each(function(){
	var $this = $(this);
	$this.addClass('ui-state-default').click(function(event){
		$('#leftCol nav a').removeClass('ui-state-active');
		$this.addClass('ui-state-active');
		event.preventDefault(); //cancels any action on the href. keeps anchor from jumping.
		myControl.ext.myownersboxRIA.util.showArticle($this.attr('href').substring(1)); //substring is to strip the # off the front
		});
	});
				},



			showLoginModal : function()	{
				$('#loginFormForModal').dialog({modal: true,width:400});
				},

//executed from a 'nav' link. for instance, help > return policy would pass 'returns' and show the return policy.
//articles must exist on the dom. since they're appended to mainContentArea in most cases, they're also removed frequently.
//make sure they're available.
			showArticle : function(subject)	{
				myControl.util.dump("BEGIN myownersboxRIA.util.showArticle ("+subject+")");
				$('#mainContentArea article').hide();
				$('#'+subject+'Article').show();
				$('#globalMessaging').empty();

				var authState = myControl.sharedCheckoutUtilities.determineAuthentication();
				myControl.util.dump(" -> authState = "+authState);
//don't show any pages that require login unless the user is logged in.
				if((authState != 'authenticated') && (subject == 'orders' || subject == 'wishlist' || subject == 'forgetme' || subject == 'myaccount'))	{
//in addition to showing the modal window, the article the user was trying to see is added to the 'continue' button that appears after a successful login
//this will be fluid, as it'll take them where they expected to go.
					myControl.ext.myownersboxRIA.util.showLoginModal();
					$('#loginSuccessContainer').empty();
					$('<button>').addClass('stdMargin ui-state-default ui-corner-all  ui-state-active').attr('id','modalLoginContinueButton').text('Continue').click(function(){
						$('#loginFormForModal').dialog('close');
						myControl.ext.myownersboxRIA.util.showArticle(subject)
						}).appendTo($('#loginSuccessContainer'));					

					}
				else	{
					switch(subject)	{
						case 'newsletter':
							$('#newsletterFormContainer').empty();
							myControl.ext.store_crm.util.showSubscribe({'parentID':'newsletterFormContainer','templateID':'subscribeFormTemplate'});
							break;
						case 'orders':
								myControl.ext.store_crm.calls.getCustomerOrderList.init({'parentID':'orderHistoryContainer','templateID':'orderLineItemTemplate','callback':'showOrderHistory','extension':'store_crm'});
							break;
						case 'wishlist':
							myControl.ext.store_crm.calls.getCustomerList.init('wishlist',{'parentID':'wishlistContainer','callback':'showList','extension':'myownersboxRIA'});
						case 'forgetme':
							myControl.ext.store_crm.calls.getCustomerList.init('forgetme',{'parentID':'forgetmeContainer','callback':'showList','extension':'myownersboxRIA'}); 
						default:
							//the default action is handled in the 'show' above. it happens for all.
						}
					}
				myControl.model.dispatchThis();
				},

			showRecentSearches : function()	{
				var o = ''; //output. what's added to the recentSearchesList ul
				var L = myControl.ext.myownersboxRIA.vars.user.recentSearches.length;
				var keywords,count;
				for(i = 0; i < L; i++)	{
					keywords = myControl.ext.myownersboxRIA.vars.user.recentSearches[i];
//					myControl.util.dump(" -> myControl.data['searchResult|"+keywords+"'] and typeof = "+typeof myControl.data['searchResult|'+keywords]);
					count = $.isEmptyObject(myControl.data['searchResult|'+keywords]) ? 0 : myControl.data['searchResult|'+keywords]['@products'].length
//					myControl.util.dump(" -> adding "+keywords+" to list of recent searches");
// 
					o += "<li><a href='#' onClick=\"$('#headerKeywordsInput').val('"+keywords+"'); $('#headerSearchFrm').submit();\">"+keywords+" ("+count+")<\/a><\/li>";
					}
				$('#recentSearchesList').html(o);
				},

			breadcrumb : function(catSafeID)	{
				myControl.util.dump("BREADCRUMB cat safe id = "+catSafeID);
				if(catSafeID == '.')	{
//do nothing on the homepage.
					}
				else	{
					var pathArray = catSafeID.split('.');
					var $bc = $('#breadcrumb'); //no need to empty because the 'page' gets reset each load .
					var len = pathArray.length - 1; // don't show the breadcrumb for the page in focus. we'll use an H1 for that.
//s is used to concatonate the safe id.  so if safeid = my.safe.id.is.here, then when i=1 s = my, when i=2, pass = my.safe and so forth.
//when split occurs on catSafeId, the zero spot in the array is blank.  so s is set to . and in the zero pass in the loop, it'll load the homepage.
					var s = '.'; 
					for (var i=0; i<len; i+=1) {
						s += pathArray[i];
						myControl.util.dump(s);
						$bc.append(myControl.renderFunctions.transmogrify({"id":"breadcrumb_"+s,"catsafeid":s},'categoryTemplate',myControl.data['categoryDetail|'+s]))
//after each loop, the . is added so when the next cat id is appended, they're concatonated with a . between. won't matter on the last loop cuz we're done.
						s += i == 0 ? "" : ".";
						}
					}
				},
				
			showPage : function(catSafeID)	{
//				 
				$(".ui-dialog-content").dialog("close");  //close any open dialogs. important cuz a 'showpage' could get executed via wiki in a modal window.
//				$('#mainContentArea').empty().append(myControl.renderFunctions.createTemplateInstance('categoryPageTemplate','page-'+catSafeID));
				if(catSafeID == '.')	{
					$('#mainContentArea').empty().append(myControl.renderFunctions.transmogrify('homepage','homepageTemplate',{}));
					}
				else	{
//showPage is executed on app init. if globalmessaging is emptied, init messaging doesn't show up so only nuke errors for non-homepages.
					$('#globalMessaging').empty().hide(); 
					$('#mainContentArea').empty().append(myControl.renderFunctions.transmogrify('page-'+catSafeID,'categoryPageTemplate',{}));
					if(myControl.ext.store_navcats.calls.categoryDetailMax.init(catSafeID,{"callback":"showPageContent","extension":"myownersboxRIA"}))	{
						myControl.model.dispatchThis();
						}
					}
				this.addPushState({'catSafeID':catSafeID})
				},

			showOrderDetails : function(orderID)	{
//				myControl.util.dump("BEGIN myownersboxRIA.util.showOrderDetails");
				var safeID = myControl.util.makeSafeHTMLId(orderID);
				$orderEle = $('#orderContents_'+safeID);
//if the element is empty, then this is the first time it's been clicked. Go get the data and display it, changing classes as needed.
				if($orderEle.is(':empty'))	{
					$orderEle.show().addClass('ui-corner-bottom ui-accordion-content-active'); //object that will contain order detail contents.
					$orderEle.append(myControl.renderFunctions.createTemplateInstance('orderContentsTemplate','orderContentsTable_'+safeID))
					$('#orderContentsTable_'+safeID).addClass('loadingBG');
					if(myControl.ext.store_crm.calls.getCustomerOrderDetail.init(orderID,{'callback':'showOrder','extension':'store_crm','templateID':'orderContentsTemplate','parentID':'orderContentsTable_'+safeID}))
						myControl.model.dispatchThis();
						
					$orderEle.siblings().addClass('ui-state-active').removeClass('ui-corner-bottom').find('.ui-icon-triangle-1-e').removeClass('ui-icon-triangle-1-e').addClass('ui-icon-triangle-1-s');
					}
				else	{
//will only get here if the data is already loaded. show/hide panel and adjust classes.
//myControl.util.dump("$orderEle.is(':visible') = "+$orderEle.is(':visible'));
if($orderEle.is(':visible'))	{
	$orderEle.removeClass('ui-corner-bottom ui-accordion-content-active').hide();
	$orderEle.siblings().removeClass('ui-state-active').addClass('ui-corner-bottom').find('.ui-icon-triangle-1-s').removeClass('ui-icon-triangle-1-s').addClass('ui-icon-triangle-1-e')
	}
else	{
	$orderEle.addClass('ui-corner-bottom ui-accordion-content-active').show();
	$orderEle.siblings().addClass('ui-state-active').removeClass('ui-corner-bottom').find('.ui-icon-triangle-1-e').removeClass('ui-icon-triangle-1-e').addClass('ui-icon-triangle-1-s')
	}
					}
				

				},
	
			removeByValue : function(arr, val) {
				for(var i=0; i<arr.length; i++) {
					if(arr[i] == val) {
						arr.splice(i, 1);
						break;
						}
					}
				},

			showCart : function()	{
//				myControl.util.dump("BEGIN myownersboxRIA.util.showCart");
				myControl.ext.store_cart.util.showCartInModal('cartViewer');
				if(myControl.ext.store_cart.vars.cartAccessories.length > 0)	{
					myControl.ext.store_prodlist.util.buildProductList({"templateID":"productTemplate","parentID":"cartAccessoriesCarousel","csv":myControl.ext.store_cart.vars.cartAccessories});
					myControl.model.dispatchThis();
					$('#cartAccessoriesCarouselContainer').show(); //container is hidden by default.
					$('#cartAccessoriesCarousel').jcarousel();
					}
				},

			handleAddToList : function(pid,listID)	{

myControl.util.dump("BEGIN myownersboxRIA.util.handleAddToList ("+pid+")");
var authState = myControl.sharedCheckoutUtilities.determineAuthentication();
if(authState == 'authenticated')	{
	myControl.ext.store_crm.calls.addToCustomerList.init({"listid":listID,"sku":pid},{"parentID":"CRMButtonMenu","message":"Item has been added to your list","callback":"showMessaging"}); 
	myControl.model.dispatchThis();
	}
else	{
	myControl.ext.myownersboxRIA.util.showLoginModal();
	$('#loginMessaging').append("This feature requires you to be logged in.");
	$('#loginSuccessContainer').empty();
	$('<button>').addClass('stdMargin ui-state-default ui-corner-all  ui-state-active').attr('id','modalLoginContinueButton').text('Continue').click(function(){
		$('#loginFormForModal').dialog('close');
		myControl.ext.myownersboxRIA.util.handleAddToList(pid,listID);
		}).appendTo($('#loginSuccessContainer'));
	}


				}, //handleAddToList
//executed in checkout when 'next/submit' button is pushed for 'existing account' after adding an email/password. (preflight panel)
//handles inline validation
			loginFrmSubmit : function(email,password)	{
				var errors = '';
				var $errorDiv = $("#loginMessaging").empty().toggle(false); //make sure error screen is hidden and empty.
				
				if(myControl.util.isValidEmail(email) == false){
					errors += "Please provide a valid email address<br \/>";
					}
				if(!password)	{
					errors += "Please provide your password<br \/>";
					}
					
				if(errors == ''){
					myControl.calls.authentication.zoovy.init({"login":email,"password":password},{'callback':'authenticateZoovyUser','extension':'myownersboxRIA'});
					myControl.ext.store_cart.calls.getCartContents.init('','immutable'); //cart needs to be updated as part of authentication process.
					myControl.ext.store_crm.calls.getCustomerList.init('forgetme',{'callback':'handleForgetmeList','extension':'store_prodlist'},'immutable');
					myControl.model.dispatchThis('immutable');
					}
				else {
					$errorDiv.toggle(true).append(myControl.util.formatMessage(errors));
					}
				}, //loginFrmSubmit

			userIsLoggedIn : function()	{
//classes are used to hide or enable features based on whether or not the user is logged in.
//this will only impact elements currently rendered to the screen.
// SANITY - this update will only effect classes that are 'on screen' when it is executed.
				$('.disableIfLoggedOut').removeAttr('disabled');
				$('.showIfLoggedIn').show();
				$('.hideIfLoggedIn').hide();
				} //userIsLoggedIn
			
			} //util


		
		} //r object.
	return r;
	}