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
		"templates" : ['productTemplate','mpControlSpec','categoryTemplate','categoryPageTemplate','prodViewerTemplate','cartViewer','cartViewerProductTemplate','prodReviewSummaryTemplate','productChildrenTemplate','prodReviewsTemplate','reviewFrmTemplate','subscribeFormTemplate','categoryThumbTemplate','orderLineItemTemplate','orderContentsTemplate','cartSummaryTemplate','orderProductLineItemTemplate','helpTemplate','customerTemplate','productDetailedTemplate','homepageTemplate','configuratorTemplate','leftColRootCatsTemplate','searchTemplate','faqTopicTemplate','catPageHeaderTemplate','faqQnATemplate'],
		"user" : {
			"recentSearches" : [],
			"recentlyViewedItems" : []
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
				myControl.ext.store_navcats.calls.categoryTree.init(); 
				myControl.ext.myownersboxRIA.util.handleLegacyURL(); //checks url and will load appropriate page content.
				
//get some info to have handy for when needed (cart, profile, etc)
				myControl.calls.getProfile.init(myControl.vars.profile,{"callback":"haveProfileData","extension":"myownersboxRIA"});
				myControl.ext.store_cart.calls.getCartContents.init({'callback':'updateMCLineItems','extension':'myownersboxRIA'},'mutable');
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
					myControl.ext.myownersboxRIA.util.changeNavTo('search');
					myControl.ext.store_search.calls.searchResult.init($(this).serializeJSON(),{'callback':'showResults','extension':'myownersboxRIA'});
					// DO NOT empty altSearchesLis here. wreaks havoc.
					myControl.model.dispatchThis();
					return false;
					});
					
				$('#headerSearchFrmSubmit').removeAttr('disabled');
				var authState = myControl.sharedCheckoutUtilities.determineAuthentication();
				
				if(authState && (authState == 'authenticated' || authState == 'thirdPartyGuest'))	{
					myControl.util.dump("App thinks user is authenticated: "+authState);
					myControl.ext.myownersboxRIA.util.userIsLoggedIn();
					}

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
			onError : function(responseData,uuid)	{
				myControl.util.handleErrors(responseData,uuid)
				}
			},



//update any element with a .itemCount class with current # of items in the mincart.
		updateMCLineItems : 	{
			onSuccess : function(tagObj)	{
//				myControl.util.dump("BEGIN myownersboxRIA.callbacks.updateMCLineItems");
				var itemCount = myControl.util.isSet(myControl.data[tagObj.datapointer].cart['data.item_count']) ? myControl.data[tagObj.datapointer].cart['data.item_count'] : myControl.data[tagObj.datapointer].cart['data.add_item_count']
//				myControl.util.dump(" -> itemCount: "+itemCount);
				$('.itemCount').text(itemCount);
				},
			onError : function(responseData,uuid)	{
				myControl.util.handleErrors(responseData,uuid)
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
			onError : function(responseData,uuid)	{
				myControl.util.handleErrors(responseData,uuid)
				}
			},
		haveProfileData : {
			onSuccess : function(tagObj)	{
//				myControl.util.dump("BEGIN myownersboxRIA.callbacks.haveProfileData.onSuccess");
				$('#logo').empty().append(myControl.util.makeImage({'tag':1,'w':210,'h':155,'m':0,'name':myControl.data[tagObj.datapointer]['zoovy:logo_website'],'b':'tttttt'})).click(function(){
					myControl.ext.myownersboxRIA.util.handlePageContent('homepage','.');
					});
				},
			onError : function(responseData,uuid)	{
				myControl.util.handleErrors(responseData,uuid)
				}
			}, //haveProfileData

//executed when the cart is changed, such as a zip entered or a country selected.
		cartUpdated :	{
			onSuccess : function(tagObj)	{
				myControl.util.dump("BEGIN myownersboxRIA.callbacks.cartUpdated.onSuccess");
				myControl.ext.store_cart.util.showCartInModal();
				handleCartDrawerPromotion();
				},
			onError : function(responseData,uuid)	{
				myControl.util.handleErrors(responseData,uuid)
				}
			},


		showPageContent : {
			onSuccess : function(tagObj)	{
				var catSafeID = tagObj.datapointer.split('|')[1];
				myControl.renderFunctions.translateTemplate(myControl.data['categoryDetail|'+catSafeID],'page-'+catSafeID);
//add root categories to left column.
				myControl.ext.store_navcats.util.getChildDataOf('.',{'parentID':'rootcategoryListContainer','callback':'addCatToDom','templateID':'leftColRootCatsTemplate','extension':'store_navcats'},'categoryDetailMore');
				if(typeof myControl.data['categoryDetail|'+catSafeID]['@subcategoryDetail'] == 'object')	{
					myControl.ext.store_navcats.util.getChildDataOf(catSafeID,{'parentID':'subcategoryListContainer','callback':'addCatToDom','templateID':'categoryThumbTemplate','extension':'store_navcats'},'categoryDetailMax');
					}
				else	{
//no subcategories are present. do something else or perhaps to nothing at all.
					}
				myControl.ext.store_prodlist.util.buildProductList({"templateID":"productTemplate","withInventory":1,"withVariations":1,"parentID":"productListContainer","items_per_page":20,"csv":myControl.data[tagObj.datapointer]['@products']});
				myControl.model.dispatchThis();
				//don't show the breadcrumb on the homepage.				
				if(catSafeID != '.'){myControl.ext.myownersboxRIA.util.breadcrumb(catSafeID)}
				$('#mainContentArea').removeClass('loadingBG');
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
			onError : function(responseData,uuid)	{
				myControl.util.handleErrors(responseData,uuid)
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
			onError : function(responseData,uuid)	{
				myControl.util.handleErrors(responseData,uuid);
//$('#searchNav').append(myControl.util.getResponseErrors(d)).toggle(true); //here just in case. replaced w/ line above.
				$('#altSearchesList').removeClass('loadingBG')
				}
			
			}, //updateSearchNav


		showResults :  {
			onSuccess : function(tagObj)	{
				myControl.util.dump('BEGIN myControl.ext.myownersboxRIA.callbacks.showResults.onSuccess');
				
				var keywords = tagObj.datapointer.split('|')[1];
//recent searches should not contain duplicates.
				if($.inArray(keywords,myControl.ext.myownersboxRIA.vars.user.recentSearches) < 0)
					myControl.ext.myownersboxRIA.vars.user.recentSearches.push(keywords);
				$('#altSearchesList').empty(); //clear existing 'alternative searches'
//				myControl.util.dump(' -> altSearchList emptied.');
				if(myControl.data[tagObj.datapointer]['@products'].length == 0)	{
					$('#resultsProdlist').empty().append("Zero items matched your search.  Please try again.");
					}
				else	{

//will handle building a template for each pid and tranlating it once the data is available.
//returns # of requests needed. so if 0 is returned, no need to dispatch.
					myControl.ext.store_prodlist.util.buildProductList({"templateID":"productTemplate","parentID":"resultsProductListContainer","items_per_page":20,"csv":myControl.data[tagObj.datapointer]['@products']})
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
			onError : function(responseData,uuid)	{
				myControl.util.handleErrors(responseData,uuid)
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
				return "<a href='#' onClick='myControl.ext.myownersboxRIA.util.handlePageContent(\"category\",\""+suffix+"\")'>"+phrase+"<\/a>"
				},
			":product" : function(suffix,phrase){
				return "<a href='#' onClick='myControl.ext.myownersboxRIA.util.handlePageContent(\"product\",\""+suffix+"\")'>"+phrase+"<\/a>"
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
							o += "<li onClick=\"myControl.ext.myownersboxRIA.util.handlePageContent('category','"+catSafeID+"');\"> &#187; "+myControl.data['categoryDetail|'+data.bindData.cleanValue]['@subcategoryDetail'][i].pretty;
							if(myControl.data['categoryDetail|'+data.bindData.cleanValue]['@subcategoryDetail'][i]['@products'].length > 0)
								o += " ("+myControl.data['categoryDetail|'+data.bindData.cleanValue]['@subcategoryDetail'][i]['@products'].length+" items)"
							o += "<\/li>";
							}
						}
					if(L > 3)	{
						o += "<li onClick=\"myControl.ext.myownersboxRIA.util.handlePageContent('category','"+data.bindData.cleanValue+"');\">&#187; <b> View all "+L+" Categories<\/b><\/li>";
						}
					$tag.append(o);
					}		
				}, //subcatList
				
//the link should ONLy appear if the sku is a storageContainer.
//in this case, more than one attribute is needed, so the pid is passed in and the product data object is looked up.
			linkToConfigurator : function($tag,data)	{
				var pData = myControl.data['getProduct|'+data.bindData.cleanValue]['%attribs'];
				var pid = data.bindData.cleanValue;
				if(pData['zoovy:prod_dimensions'] && pData['user:prod_organization'] && myControl.ext.myownersboxRIA.util.guessContainerParentCat(pid))	{
					$tag.addClass('pointer').click(function(){
						myControl.ext.myownersbox_configurator.actions.initConfigurator({'s1':myControl.ext.myownersboxRIA.util.guessContainerParentCat(pid),'s2':pid}); return false;
						}).append("<span class='spriteBG addContainerLink'></span>");
					}
				else	{
					//dimensions aren't set, prod_organization isn't set, or container cat can't be determined. 
					myControl.util.dump("-> dimensions ["+pData['zoovy:prod_dimensions']+"], organization ["+pData['user:prod_organization']+"] or parent cat ["+myControl.ext.myownersboxRIA.util.guessContainerParentCat(pid)+"] can't be determined.");
					}
				
				}
			},


////////////////////////////////////   UTIL    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		util : {
//tries to guess which storage container category is most appropriate for this category.
			guessContainerParentCat : function(pid)	{
				var r,org;
				org = myControl.data['getProduct|'+pid]['%attribs']['user:prod_organization']
				if(org)	{
					if(org == 'MLB'){r = '.storage-containers.major-league-baseball'}
					else if(org == 'NFL'){r = '.storage-containers.national-football-league'}
					else{r = false}
					}
				else	{r = false;}
				return r;
				},

//used to load page content based on legacy linking syntax.					
			handleLegacyURL : function()	{
				var pageType = this.whatPageTypeAmI(window.location.href);
// will return either the safe path or pid or something else useful
// hash.substring(0) will return everything preceding a #, if present.
				var pageInfo = this.giveMeRelevantInfoToPage(window.location.href); 
				this.handlePageContent(pageType,pageInfo,true);
				},

//loads page content. pass in a type: category, product, customer or help
// and a page info: catSafeID, sku, customer admin page (ex: newsletter) or 'returns' (respectively to the line above.
			handlePageContent : function(pageType,pageInfo,skipPushState)	{
//				myControl.util.dump("BEGIN handlePageContent. type: "+pageType+" and info: "+pageInfo+" and skipPushState: "+skipPushState);
				switch(pageType)	{

				case 'product':
					myControl.ext.myownersboxRIA.util.showProd(pageInfo);
					break;

				case 'category':
					if(pageInfo == '.customizer')	{
						myControl.ext.myownersbox_configurator.actions.initConfigurator(myControl.util.getParametersAsObject());
						}
					else	{
						myControl.ext.myownersboxRIA.util.showPage(pageInfo);
						}
					break;

				case 'customer':
					myControl.ext.myownersboxRIA.util.changeNavTo('customer',pageInfo);
					break;

				case 'checkout':
					$('#mainContentArea').empty(); //duh.
					$(".ui-dialog-content").dialog("close"); //close all modal windows.
					myControl.ext.convertSessionToOrder.calls.startCheckout.init('mainContentArea');
					break;

				case 'help':
					myControl.ext.myownersboxRIA.util.changeNavTo('help',pageInfo);
					break;

				case 'homepage':
						myControl.ext.myownersboxRIA.util.showPage('.');
						break;

				default:
					//uh oh. what are we? default to homepage.
					myControl.ext.myownersboxRIA.util.showPage('.');
					}
				if(!skipPushState)	{this.addPushState({'pageType':pageType,'pageInfo':pageInfo})} //skipped when executed from a 'pop' or when initial page loads.
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
//				myControl.util.dump("whatPageTypeAmI = "+r);
				return r;
				},



			giveMeRelevantInfoToPage : function(url)	{
				var r; //what is returned.
//				myControl.util.dump("BEGIN myownersboxRIA.util.giveMeRelevantInfoToPage");
//				myControl.util.dump(" -> url before hashsplit = "+url);
				
				if(url.indexOf('#') > 0)	{
//					myControl.util.dump(" -> url contains hash (#)");
					url = url.substr(0, url.indexOf('#')); //strip off everything after hash (#)
					}
				url = url.split('?')[0] //get rid of any uri vars.
//				myControl.util.dump(" -> url after hashsplit = "+url);
				if(url.indexOf('/product/') > 0)	{
					r = url.split('/product/')[1]; //should be left with SKU or SKU/something_seo_friendly.html
					if(r.indexOf('/') > 0)	{r = r.split('/')[0];} //should be left with only SKU by this point.
					}
				else if(url.indexOf('/category/') > 0)	{
					r = url.split('/category/')[1]; //left with category.safe.id or category.safe.id/
					myControl.util.dump(" after /category/ split, r = "+r);
					if(r.charAt(r.length-1) == '/')	{r = r.slice(0, -1)} //strip trailing /
					myControl.util.dump(" after strip trailing slash, r = "+r);
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
//				myControl.util.dump("giveMeRelevantInfoToPage = "+r);
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
//p is an object that gets passed into a pushState in 'addPushState'.  pageType and pageInfo are the only two params currently.
//https://developer.mozilla.org/en/DOM/window.onpopstate
			handlePopState : function(P)	{
//on initial load, P will be blank.
				if(P && P.pageType && P.pageInfo)	{
					this.handlePageContent(P.pageType,P.pageInfo,true);
					myControl.util.dump("POPSTATE Executed.  pageType = "+P.pageType+" and pageInfo = "+P.pageInfo);
					}
				},
			
//pass in the 'state' object. ex: {'pid':'somesku'} or 'catSafeID':'.some.safe.path'
//will add a pushstate to the browser for the back button and change the URL
//http://spoiledmilk.dk/blog/html5-changing-the-browser-url-without-refreshing-page

			addPushState : function(P)	{
				var title = 'myOwnersBox '+P.pageInfo;
				var relativePath;
//				myControl.util.dump("BEGIN addPushState. ");
//				myControl.util.dump(P);
				switch(P.pageType)	{
				case 'product':
					relativePath = '/product/'+P.pageInfo+'/';
					break;
				case 'category':
//don't want /category/.something, wants /category/something
//but the period is needed for passing into the pushstate.
					var noPrePeriod = P.pageInfo.charAt(0) == '.' ? P.pageInfo.substr(1) : P.pageInfo; 
					relativePath = '/category/'+noPrePeriod+'/';
					break;
				case 'customer':
					relativePath = '/customer/'+P.pageInfo+'/';
					break;
				case 'other':
					relativePath = '/'+P.pageInfo;
					break;
				default:
					//uh oh. what are we?
					relativePath = '/'+P.pageInfo;
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
				
//add item to recently viewed list IF it is not already in the list.				
				if($.inArray(pid,myControl.ext.myownersboxRIA.vars.user.recentlyViewedItems) < 0)
					myControl.ext.myownersboxRIA.vars.user.recentlyViewedItems.push(pid);

				
				},
			

			changeNavTo : function(newNav,article)	{
//				myControl.util.dump("BEGIN myownersboxRIA.util.changeNavTo ("+newNav+")");

				$(".ui-dialog-content").dialog("close");  //close any open dialogs. important cuz could get executed via wiki in a modal window.

//new nav is 'customer' or 'help'. search nav may or may not be supported for this RIA
				if(!newNav)	{myControl.util.dump("WARNING - nav type not specified for changeNavTo");}
				else if(newNav == 'search')	{
					$('#mainContentArea').empty().append(myControl.renderFunctions.transmogrify('mainContentArea_'+newNav,newNav+'Template',myControl.data['getProfile|'+myControl.vars.profile]))
					}
				else if (newNav == 'help' || newNav == 'customer')	{
					$('#mainContentArea').empty().append(myControl.renderFunctions.transmogrify('mainContentArea_'+newNav,newNav+'Template',myControl.data['getProfile|'+myControl.vars.profile]))
					}
				else	{
//unknown nav.
myControl.util.dump("WARNING - unknown nav type ["+newNav+"] specified for changeNavTo");
					}
				myControl.ext.myownersboxRIA.util.bindNav(newNav);
				if(article)
					this.showArticle(article);

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

			bindNav : function(newNav)	{
myControl.util.dump("BEGIN bindNav ("+newNav+")");
$('#leftCol nav a').each(function(){
	var $this = $(this);
	$this.addClass('ui-state-default').click(function(event){
		$('#leftCol nav a').removeClass('ui-state-active');
		event.preventDefault(); //cancels any action on the href. keeps anchor from jumping.
//		myControl.ext.myownersboxRIA.util.showArticle($this.attr('href').substring(1)); //substring is to strip the # off the front
		myControl.ext.myownersboxRIA.util.handlePageContent(newNav,$this.attr('href').substring(1))
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
//				myControl.util.dump("BEGIN myownersboxRIA.util.showArticle ("+subject+")");
				$('#mainContentArea article').hide();
				$('#leftCol [href=#'+subject+']').addClass('ui-state-highlight');
				$('#globalMessaging').empty();

				var authState = myControl.sharedCheckoutUtilities.determineAuthentication();
//				myControl.util.dump(" -> authState = "+authState);
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
					$('#'+subject+'Article').show(); //only show content if page doesn't require authentication.
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
							break;
						case 'faq':
							myControl.ext.store_crm.calls.appFAQsAll.init({'parentID':'faqContent','callback':'showFAQTopics','extension':'store_crm','templateID':'faqTopicTemplate'});
							break;
						case 'forgetme':
							myControl.ext.store_crm.calls.getCustomerList.init('forgetme',{'parentID':'forgetmeContainer','callback':'showList','extension':'myownersboxRIA'}); 
							break;
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
					o += "<li><a href='#' onClick=\"$('#headerKeywordsInput').val('"+keywords+"'); $('#headerSearchFrm').submit(); return false;\">"+keywords+" ("+count+")<\/a><\/li>";
					}
				$('#recentSearchesList').html(o);
				},

			breadcrumb : function(catSafeID)	{
//				myControl.util.dump("BREADCRUMB cat safe id = "+catSafeID);
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
//						myControl.util.dump(s);
//### need to update this to check if data is present. may not be if user came straight to a cat page.
						$bc.append(myControl.renderFunctions.transmogrify({"id":"breadcrumb_"+s,"catsafeid":s},'categoryTemplate',myControl.data['categoryDetail|'+s]))
//after each loop, the . is added so when the next cat id is appended, they're concatonated with a . between. won't matter on the last loop cuz we're done.
						s += i == 0 ? "" : ".";
						}
					}
				},


			showPage : function(catSafeID)	{
//				myControl.util.dump("BEGIN myownersboxRIA.util.showPage("+catSafeID+")");
				$(".ui-dialog-content").dialog("close");  //close any open dialogs. important cuz a 'showpage' could get executed via wiki in a modal window.
//				$('#mainContentArea').empty().append(myControl.renderFunctions.createTemplateInstance('categoryPageTemplate','page-'+catSafeID));
				if(catSafeID == '.')	{
					$('#mainContentArea').empty().append(myControl.renderFunctions.transmogrify('homepage','homepageTemplate',{}));
					}
				else	{
//showPage is executed on app init. if globalmessaging is emptied, init messaging doesn't show up so only nuke errors for non-homepages.
					$('#globalMessaging').empty().hide(); 
//add category page template to DOM.
					$('#mainContentArea').empty().append(myControl.renderFunctions.transmogrify('page-'+catSafeID,'categoryPageTemplate',{}));

//get category data for displaying page
					myControl.ext.store_navcats.calls.categoryDetailMax.init(catSafeID,{"callback":"showPageContent","extension":"myownersboxRIA"});
					
					$('#catPageTopContent').append(myControl.renderFunctions.createTemplateInstance('catPageHeaderTemplate',{'id':'catPageContent'}));
					
					myControl.ext.store_navcats.calls.appPageGet.init({'PATH':catSafeID,'@get':['picture1','picture2','picture3','picture4','description1','wide_banner1','header_subcats1','header1','header2']},{"callback":"translateTemplate","parentID":"catPageContent"});
					myControl.model.dispatchThis();

					}
			
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
			
			
			handleCartDrawerPromotion : function()	{
				var $target = $('#promotionalContent');
				var hasContainer = false;
				var numSpots;
				var numDrawers = 0;
				if(!$.isEmptyObject(myControl.data.showCart.cart.stuff))	{
					for(index in myControl.data.showCart.cart.stuff)	{
						if(myControl.data.showCart.cart.stuff[index].full_product['zoovy:prod_dimensions']){
							if(myControl.data.showCart.cart.stuff[index].full_product['zoovy:prod_dimensions'] == '3x3')	{
								hasContainer=true
								numSpots = 9;
								}
							else if(myControl.data.showCart.cart.stuff[index].full_product['zoovy:prod_dimensions'] == '2x3')	{
								hasContainer=true
								numSpots = 6;
								}
							else	{
								//item is a 1x3 which doesn't qualify for the promotion OR an unknown dimension.
								}
							}
						if(myControl.data.showCart.cart.stuff[index].full_product['is:user1'])	{
							numDrawers += 1;
							}
						}
					
					myControl.util.dump(" -> hasContainer: "+hasContainer);
					myControl.util.dump(" -> numSpots: "+numSpots);
					if(numDrawers >= numSpots)	{
						$target.append("Your order qualifies for 15% off!");
						}
					else	{
						$target.append("Add "+numSpots - numDrawers+" more drawers to receive 15% off your storage organizer");
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
			
			validateContactForm : function()	{
				var valid = true;
				var errors ="<ul>";
				var $errorContainer = $('#contactFormMessaging').empty(); //where errors will be displayed
				var email = $('#contactFormSender').val();

				if(!email)	{
					errors += "<li>please provide an email address<\/li>";
					valid = false;
					}
				else if(!myControl.util.isValidEmail(email))	{
					errors += "<li>please provide a valid email address<\/li>";
					valid = false;
					}
				if(!$('#contactFormBody').val())	{
					errors += "<li>please include a message<\/li>";
					valid = false;
					}
				
				errors += "<\/ul>";
				myControl.util.dump($('#contactForm').serializeJSON());
				if(valid)	{
					myControl.ext.store_crm.calls.appSendMessage.init($('#contactForm').serializeJSON(),{'callback':'showMessaging','message':'Thank you, your message has been sent','parentID':'contactFormMessaging'});
					myControl.model.dispatchThis("immutable");
					}
				else	{
					$errorContainer.append(myControl.util.formatMessage({'message':errors,'uiIcon':'notice'}));
					}
				return valid;
				},


//assumes the faq are already in memory.
			showFAQbyTopic : function(topicID)	{
				myControl.util.dump("BEGIN showFAQbyTopic ["+topicID+"]");
				var templateID = 'faqQnATemplate'
				var $target = $('#faqDetails4Topic_'+topicID).empty().show();
				if(!topicID)	{
					myControl.util.dump("a required parameter was blank for showFAQbyTopic:");	myControl.util.dump(" -> topicID: "+topicID);
					}
				else if(!myControl.data['appFAQs'] || $.isEmptyObject(myControl.data['appFAQs']['@detail']))	{
					myControl.util.dump(" -> No data is present");
					}
				else	{
					var L = myControl.data['appFAQs']['@detail'].length;
					myControl.util.dump(" -> total #faq: "+L);
					for(var i = 0; i < L; i += 1)	{
						if(myControl.data['appFAQs']['@detail'][i]['TOPIC_ID'] == topicID)	{
							myControl.util.dump(" -> faqid matches topic: "+myControl.data['appFAQs']['@detail'][i]['ID']);
							$target.append(myControl.renderFunctions.transmogrify({'id':topicID+'_'+myControl.data['appFAQs']['@detail'][i]['ID'],'data-faqid':+myControl.data['appFAQs']['@detail'][i]['ID']},templateID,myControl.data['appFAQs']['@detail'][i]))
							}
						}
					}
				},




			handleAddToCart : function(formID)	{
				myControl.ext.store_product.calls.addToCart.init(formID,{'callback':'itemAddedToCart','extension':'store_product'});
				myControl.ext.store_product.calls.getCartContents.init({'callback':'updateMCLineItems','extension':'myownersboxRIA'});
				myControl.model.dispatchThis('immutable');
				},
			
//used on the faq page when a topic is clicked. requests faq for that topic
			showFAQs : function(topicID)	{
				var tagObj = {'callback':'itemAddedToCart','extension':'store_product'};
				},
			
			
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