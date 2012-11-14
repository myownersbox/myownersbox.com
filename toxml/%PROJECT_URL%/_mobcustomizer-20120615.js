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



var myownersbox_configurator = function() {
	var r = {
	vars : {
		"recentlyRemoved" : new Array(),
		"uriParams" : "", //stores a list of K/V pairs of what is selected in the customizer. used when a shopper returns to the page.
		"templates" : ['mobDrawerChooser','mobStorageContainerProductSpec','mobStorageChooser','mobDrawerProductSpec','mobRecentViewedProductSpec'],
		"dependencies" : ['store_prodlist','store_navcats','store_product'], //a list of other extensions (just the namespace) that are required for this one to work.
		"dependAttempts" : 0 //used to count how many times the dependencies have been attempted.
		},

					////////////////////////////////////   CALLS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\		



	calls : {


		cartItemsAdd : {
			init : function(obj)	{
				this.dispatch(obj);
				return 1;
				},
			dispatch : function(obj)	{
//				myControl.util.dump("BEGIN myControl.ext.myownersbox_configurator.calls.cartItemsAdd.dispatch");
				obj["_cmd"] = "cartItemsAdd"; 
				obj["_tag"] = {"callback":"itemAddedToCart","extension":"myownersbox_configurator"};
				myControl.model.addDispatchToQ(obj,'immutable');
				}
			} //cartItemsAdd
		
		}, //calls






					////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\









	callbacks : {
//callbacks.init need to return either a true or a false, depending on whether or not the file will execute properly based on store account configuration.
		init : {
			onSuccess : function()	{
//				myControl.util.dump('BEGIN myControl.ext.store_navcats.init.onSuccess ');
				var r = true; //return false if extension won't load for some reason (account config, dependencies, etc).
				return r;
				},
			onError : function()	{
				myControl.util.dump('BEGIN myControl.ext.store_navcats.callbacks.init.onError');
				}
			},

		initConfigurator : {
//to 'preconfigure' a configurator, pass in 'P' as an object just like format returned by getURIParams.
//for a list of keys/values, see
			onSuccess : function(P)	{

				myControl.ext.myownersbox_configurator.actions.initConfigurator(P);
				
				},
			onError : function(d)	{
				$('#globalMessaging').append(myControl.util.getResponseErrors(d)).toggle(true);
				}
			},


//simple enough.  used when page is printed. set printme=1 on URI.
		printPage : {
			onSuccess : function(tagObj)	{
				var containerPID = myControl.ext.myownersbox_configurator.vars.uriParams.s2;
//				var imageID = myControl.data['appProductGet|'+containerPID]['%attribs']['zoovy:prod_image1'];
//				$('#configuratorContainer').prepend("<div class='floatRight displayNone showInPrint'>"+myControl.util.makeImage({"h":"300","w":"300","b":"ffffff","name":imageID,"tag":1})+"<\/div>");
				window.print()
				},
			onError : function(responseData,uuid)	{
				myControl.util.handleErrors(responseData,uuid)
				}
			},


//displays the list of subcategories for .drawers (step 3). gets applied to call during app init.
		displayDrawers : {
			onSuccess : function(tagObj)	{
//				myControl.util.dump('BEGIN myownersbox_configurator.callbacks.displayDrawers.onSuccess ');
//				myControl.util.dump(' -> datapointer = '+tagObj.datapointer);
//could use tagObj.datapointer.split('|')[0] instead of hard coding IF we need that flexibility. if not, just hard code it so no extra work has to be done (faster).
				if(myControl.ext.store_navcats.util.getChildDataOf('.drawers',{'parentID':'drawerCategories','callback':'addCatToDom','templateID':'mobDrawerChooser','extension':'store_navcats'},'appCategoryDetail')){
//					myControl.util.dump(" -> getChildDataOf for "+tagObj.datapointer+" was not all local. dispatching.");
					myControl.model.dispatchThis()
					}
				
				$('#drawerCategories').removeClass('loadingBG').show(); //make sure it's visible. with a default now in place, we always want these showing.
				},
			onError : function(responseData,uuid)	{
				myControl.util.handleErrors(responseData,uuid)
				}
			},
			
//gets executed (eventually) once a category is selected in step 1. shows the product for that category.
		displayStorageContainers : {
			onSuccess : function(tagObj)	{
//				myControl.util.dump('BEGIN myControl.ext.myownersbox_configurator.callbacks.displayStorageContainers.onSuccess ');
//				myControl.util.dump(' -> datapointer = '+tagObj.datapointer);
//could use tagObj.datapointer.split('|')[0] instead of hard coding IF we need that flexibility. if not, just hard code it so no extra work has to be done (faster).
				myControl.ext.store_navcats.util.getChildDataOf('.storage-containers',{'parentID':'storageContainerCategories','callback':'addCatToDom','templateID':'mobStorageChooser','extension':'store_navcats'},'appCategoryDetailMax');
//				for(var i = 0; i < myControl.data['appCategoryDetail|.storage-containers'].subcategoryCount; i +=1)	{
//					myControl.ext.store_prodlist.util.getProductDataForLaterUse(myControl.data['appCategoryDetail|.storage-containers']['@subcategoryDetail'][i]['@products']);
//					}
				myControl.model.dispatchThis();
//				myControl.model.dispatchThis('passive'); //the getforlateruse uses the passiveq.
				},
			onError : function(responseData,uuid)	{
				myControl.util.handleErrors(responseData,uuid)
				}
			}, //displayStorageContainers


		itemAddedToCart :	{
			onSuccess : function(tagObj)	{
//do nothing for a successful add.  The cart, which is open on 'add to cart' will display this quite clearly.
				},
			onError : function(d)	{
//				myControl.util.dump('BEGIN myControl.ext.store_product.callbacks.init.onError');
				$('#addToCartBtn').removeAttr('disabled').removeClass('ui-state-disabled')
				$('#configATCMessaging').append(myControl.util.getResponseErrors(d))
				}
			
			}, //itemAddedToCart


// executed in popCustomerFromPresets if s3 is set on uri
// will populate product in spot 2.
		containerCatSelected : {
			
			onSuccess : function(tagObj)	{
				myControl.ext.myownersbox_configurator.util.containerCatSelected(tagObj.datapointer.split('|')[1]);
				},
			onError : function(responseData,uuid)	{
				myControl.util.handleErrors(responseData,uuid)
				}
			
			},//containerCatSelected

// executed in popCustomerFromPresets if s3 is set on uri
// will display preview in middle column and adjust number of 'spots' in selected drawers.
		containerSizeSelected : {
			onSuccess : function(tagObj)	{
				myControl.ext.myownersbox_configurator.util.containerSizeSelected(tagObj.datapointer.split('|')[1]);
				},
			onError : function(responseData,uuid)	{
				myControl.util.handleErrors(responseData,uuid)
				}
			}, //containerSizeSelected

// executed in popCustomerFromPresets if s3 is set on uri
//will open one of the drawer categories and load product data.

		drawerCatSelected : {
			onSuccess : function(tagObj)	{
				myControl.ext.myownersbox_configurator.util.drawerCatSelected(tagObj.datapointer.split('|')[1]);
				},
			onError : function(responseData,uuid)	{
				myControl.util.handleErrors(responseData,uuid)
				}
			}, //drawerCatSelected

// executed in popCustomerFromPresets if s3dX is set on uri, where X = spot id.
//will apply a draw to a 'spot', incuding necessary 'selected drawer' info in right col.
		addDrawerToSpot :{
			onSuccess : function(tagObj)	{
				myControl.ext.myownersbox_configurator.util.drawerAssignedToSpot(tagObj.spot,tagObj.datapointer.split('|')[1])
				},
			onError : function(responseData,uuid)	{
				myControl.util.handleErrors(responseData,uuid)
				}
			}, //addDrawerToSpot
		
		}, //callbacks





	actions : {
/*
content for the pre-populating the customizer could come from 3 locations and are 'obeyed' in this order:

passed in from memory (shopper interacted with customizer, left page, then returned)
passed directly into the function (linking from within site).
passed on the URI (external links to page)

*/
		initConfigurator : function(P) {
				myControl.util.dump('BEGIN myownersbox_configurator.actions.initConfigurator');
				myControl.util.dump(P);
//This extension needs to be able to operate without the mobRIA extension.
//so that if the configurator is loaded outside his website that ext isn't necessary.
//init could get executed not through 'showContent', so hide the banner and show the cats.
				$('#headerBanner').hide();
				$('#headerCategories').show();



			if(myControl.ext.myRIA)	{
				myControl.ext.myRIA.util.addPushState({'pageType':'category','navcat':'.customizer'})
				}

			$('#mainContentArea').empty().append(myControl.renderFunctions.transmogrify('configurator','configuratorTemplate',{}))

			var numRequests = 0; //will be > 0 if a request is needed.

//handle presets.
//variables passed in should be given priority, as per Sandy
//next, default to what is in memory.
//lastly, check url.
// ### SANITY - url 'may' have been nuked by pop/push state by now. but uri vars are handled through handleAppInit
			if(!$.isEmptyObject(P))	{
				myControl.ext.myownersbox_configurator.vars.uriParams = $.extend(myControl.ext.myownersbox_configurator.vars.uriParams,P);
//				myControl.util.dump(" -> use selections passed into function.");
//				myControl.util.dump(myControl.ext.myownersbox_configurator.vars.uriParams);
				}
			else if(!$.isEmptyObject(myControl.ext.myownersbox_configurator.vars.uriParams))	{
				//don't need to do anything here. uriParams is the var that gets used for all the processing.
//				myControl.util.dump(" -> there are selections in memory. use them.");
//				myControl.util.dump(myControl.ext.myownersbox_configurator.vars.uriParams);
				}
			else if(myControl.storageFunctions.readLocal('configurator|uriParams'))	{
				myControl.util.dump(" -> there are selections in localStorage (from a previous visit).");
				myControl.ext.myownersbox_configurator.vars.uriParams = myControl.storageFunctions.readLocal('configurator|uriParams');
				myControl.util.dump(myControl.ext.myownersbox_configurator.vars.uriParams);
				}
			else	{
				myControl.ext.myownersbox_configurator.vars.uriParams = myControl.util.getParametersAsObject(document.location.href.split('?')[1]);
//					myControl.util.dump(" -> if selections are on URI, use them.");
				}

			myControl.ext.myownersbox_configurator.vars.uriParams.printMe = null; //never set printme in uriParams. could cause accidental execution of print code.

//if certain vars are not set, apply some defaults.
			if(!myControl.util.isSet(myControl.ext.myownersbox_configurator.vars.uriParams.s1))	{
				myControl.ext.myownersbox_configurator.vars.uriParams.s1 = ".storage-containers.major-league-baseball";
					myControl.util.dump(" -> no storage organizer category set. use default.");
				}
			if(!myControl.util.isSet(myControl.ext.myownersbox_configurator.vars.uriParams.s2))	{
				myControl.ext.myownersbox_configurator.vars.uriParams.s2 = "50092MLB";
					myControl.util.dump(" -> no storage organizer product set. use default.");
				}
			if(!myControl.util.isSet(myControl.ext.myownersbox_configurator.vars.uriParams.s3))	{
				myControl.ext.myownersbox_configurator.vars.uriParams.s3 = ".drawers.major-league-baseball";
					myControl.util.dump(" -> no drawer category set. use default.");
				}



//gets navcat info (thumbs, product, name, etc). uses this data for populating step 1 and 3 immidiately and step 2 once step 1 has been completed.
//each of these calls returns the number of requests needed. so if numRequests is zero, no dispatch needed.
//get the details on the open drawer category. saves an extra request. also solves a transmogrify sequencing issue if it's added 2 the Q first.
			numRequests += myControl.ext.store_navcats.calls.appCategoryDetailMax.init(myControl.ext.myownersbox_configurator.vars.uriParams.s3);

//there's only 3 bins right now. we're inevitably going to need this data. get it now when a request is most likely happening anyway.
			numRequests += myControl.ext.store_product.calls.appProductGet.init('50062MLB');
			numRequests += myControl.ext.store_product.calls.appProductGet.init('50092MLB');
			numRequests += myControl.ext.store_product.calls.appProductGet.init('60032MLB');
			
			
			numRequests += myControl.ext.store_navcats.calls.appCategoryDetailMax.init('.storage-containers',{"callback":"displayStorageContainers","extension":"myownersbox_configurator"});
			numRequests += myControl.ext.store_navcats.calls.appCategoryDetailMax.init('.drawers',{"callback":"displayDrawers","extension":"myownersbox_configurator"});
			
			
			numRequests += myControl.ext.myownersbox_configurator.util.popCustomerFromPresets();

//			myControl.util.dump(" -> numRequests for customizer.init = "+numRequests);
			if(numRequests > 0)	{
				myControl.model.dispatchThis();  // if data above is in local, nothing will get dispatched.
				}
			
			else	{
//create empty placeholders for the 'currently selected' list in the right column.
//even if items are preselected, that's okay because they'll get updated later.
				for(var i = 1; i <= 9; i +=1)	{
					myControl.ext.myownersbox_configurator.util.addToSelectedUL(i,myControl.ext.myownersbox_configurator.vars.uriParams['s3d'+i]);	
					}
				}


if(typeof addthis == 'object')	{
	addthis.toolbox('#configuratorAddThis');
	}
			
			}, //initConfigurator
		
//guts of this found here: http://www.dynamicdrive.com/dynamicindex9/addbook.htm
		bookmarkThis : function()	{
			var title = "MyOwnersBox.com - My Customized Storage Container";
			var url = myControl.ext.myownersbox_configurator.util.makeURL();
			if (window.sidebar) // firefox
				window.sidebar.addPanel(title, url, "");
		
			else if(window.opera && window.print){ // opera
				var elem = document.createElement('a');
				elem.setAttribute('href',url);
				elem.setAttribute('title',title);
				elem.setAttribute('rel','sidebar');
				elem.click();
				}
		
			else if(document.all)// ie
				window.external.AddFavorite(url, title);


			}
		
		},



////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\





		renderFormats : {
			
			},


////////////////////////////////////   UTIL    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		util : {
/*
executed when a 'storage container' category is clicked (step 1).  it will show a list of storage containers for step 2.
it will also close the chooser, if it's open.
*/
			containerCatSelected : function(catSafeID)	{
//				myControl.util.dump("BEGIN myownersbox_configurator.util.containerCatSelected");
				var numRequests = 0;
//				myControl.util.dump("safeid = "+catSafeID);

				$('#storageContainerCategories li').removeClass('selected'); //selected class should only be set for one list item.
				$('#storageContainerCategories_'+myControl.util.makeSafeHTMLId(catSafeID)).addClass('selected'); //selected class used for makeURL function.

//puts category name at top of dropdown to make it obvious this item is in focus.
				$('#storageCatPrompt').empty().text(myControl.data['appCategoryDetail|'+catSafeID].pretty);

//the css hover menu doesn't close on click. This is a workaround. hides the dropdown, then turns it back on after a moment.
				$('#storageContainerCategories').toggle(false);
				setTimeout("$('#storageContainerCategories').toggle(true);",1000);
//the container size code needs to happen after the product list is built, otherwise 'classes' assigned are overwritten w/ transmogrify.


				myControl.ext.myownersbox_configurator.util.hideChooser(); //closes an open chooser. feels natural when using to have this happen.

//				myControl.util.dump(" -> before containerSizeSelected function executed. uriParams follow: ");
//				myControl.util.dump(myControl.ext.myownersbox_configurator.vars.uriParams);

				if(numRequests = myControl.ext.store_prodlist.util.buildProductList({"templateID":"mobStorageContainerProductSpec","parentID":"storageContainerProdlist","csv":myControl.data['appCategoryDetail|'+catSafeID]['@products']})){
					myControl.calls.ping.init({"callback":"containerSizeSelected","extension":"myownersbox_configurator","datapointer":"appProductGet|"+myControl.ext.myownersbox_configurator.vars.uriParams.s2});
					myControl.model.dispatchThis();
					}
				else	{
					//no dispatch is occuring because all data is in memory. execute the code handled in the ping above.
					if(myControl.ext.store_product.calls.appProductGet.init(myControl.ext.myownersbox_configurator.vars.uriParams.s2,{'callback':'containerSizeSelected','extension':'myownersbox_configurator'}))	{myControl.model.dispatchThis()}
					}


//				myControl.util.dump(" -> END myownersbox_configurator.util.containerCatSelected. uriParams to follow: ");
//				myControl.util.dump(myControl.ext.myownersbox_configurator.vars.uriParams);


				},

/*
executed when a 'storage container' product is clicked (step 2).  
this loads a preview image into the center column.
it will effect the number of list items in the 'currently selected' area.
it applies css classes to both the main preview window and the chooser, which crop to the correct size.
product data should already be in memory by the time this executes.
*/

			containerSizeSelected : function(pid)	{
				myControl.util.dump("BEGIN mobcustomizer.util.containerSizeSelected ["+pid+"]. uriParams to follow");
//				myControl.util.dump(myControl.ext.myownersbox_configurator.vars.uriParams);
				
				myControl.ext.myownersbox_configurator.vars.uriParams.s2 = pid;
//				myControl.util.dump("container pid = "+pid);
				$('#rightColDrawerContainer').show(); //once a container is selected, we know how many drawers spots to show in right col.
				$('#previewContainer').show(); //now we know what bin to show and how many spots. turn on preview.
				$('#drawerCategories').show(); //make sure drawers are visible.
				var size = myControl.data['appProductGet|'+pid]['%attribs']['zoovy:prod_dimensions'];

//				myControl.ext.myownersbox_configurator.util.hideChooser(); //closes an open chooser. feels natural when using to have this happen.
				if(!size)	{
//					myControl.util.dump("Warning! -> product "+pid+" may not have a size set");
					$('#globalMessaging').append(myControl.util.getResponseErrors('Error! product '+pid+' does not have a size set.'));
					}
				else	{
					var spots = myControl.ext.myownersbox_configurator.util.getSpotCountFromDimensions(size); // the # of spots available based on dimensions.

					myControl.util.dump(" -> size: "+size);
					myControl.util.dump(" -> spots: "+spots);

//empty the extra spots.

					for(var i = 1; i <= 9; i += 1) {
						if(i > spots)	{
//							myControl.util.dump(" -> RESET for spot "+i);
//if the user changes from a 9 to a six or three of from a six to a three, the 'extra' spots need to be emptied.
//otherwise, they 'stay' in the totals and product list, et all.
							myControl.ext.myownersbox_configurator.util.drawerAssignedToSpot(i);
							$('#selectedDrawerLoc_'+i).toggle(false);
							}
						else	{
//need to 'try' to populate here so that if blank, the 'empty' placeholder will show up. otherwise these spots in 'selected' just shows blank.
// added 2012-06-15
//							myControl.ext.myownersbox_configurator.util.drawerAssignedToSpot(i,myControl.ext.myownersbox_configurator.vars.uriParams["s3d"+i]);
//make sure all spots are visible (important when switching from a 6 to 9, for example)
							$('#selectedDrawerLoc_'+i).show();
							}
						}
				
//this will apply a dimension specific class to the preview to crop the extra li items. They're still there, just invisible.
					$('#selectedDrawerContainer').removeClass().addClass('selectedDrawerContainer_'+size); 
//this will apply a dimension specific class to the spots in the chooser that crops the unnecessary li items. They're still there, just invisible.
					$('#drawerLocationChooserListContainer').removeClass().addClass('drawerLocationChooserListContainer_'+size); 

//					$('#bgImageContainer').removeClass().addClass('bgImageContainer_'+size);
// CHANGED on 20120523. needed the bgimage to print, so just adding image instead of a class.					
					$('#bgImageContainer').empty().append("<img src='//static.zoovy.com/merchant/myownersbox/_ticket_482131/mbo_conf_bg-429x429-"+size+".png' />");
					
	//handle some styling.  the 'selected' class needs to be removed from all the product in the list and added to just the one now in focus.
					$('#storageContainerProdlist li').each(function() {
//						myControl.util.dump(" -> removing class for ID "+$(this).attr('id'));
						$(this).removeClass('selected');
						});
					$('#storageContainerProdlist_'+pid).addClass('selected');
					this.updateTotals();
//adjustment to 'page'-specific addthis code for addThis.  pinterest requires an image and url to be passed.
if(typeof addthis_share == 'object')	{
	var url = this.makeURL();
	url = url.replace('?','---');
	addthis_share.url = url;
	$("#socialLinks .addthis_button_facebook_like").attr("fb:like:href",url);
	$("#socialLinks .addthis_button_pinterest_pinit").attr({"pi:pinit:media":myControl.util.makeImage({"h":"300","w":"300","b":"ffffff","name":myControl.data['appProductGet|'+pid]['%attribs']['zoovy:prod_image1'],"tag":0}),"pi:pinit:url":url});
	}
					}
					
				},
	

	
//executed when a drawer category is selected.
//hides all the other product lists and shows the one now in focus.
			drawerCatSelected : function(catSafeID)	{
//				myControl.util.dump("BEGIN customizer.util.drawerCatSelected");
//				myControl.util.dump("safeid = "+catSafeID);
				myControl.ext.myownersbox_configurator.util.hideChooser(); //closes an open chooser. feels natural when using to have this happen.
				$('#drawerCategories .prodlist').toggle(false); // hide all the other product lists.
				$('#drawerCategories li').removeClass('selected'); //remove selected class from all list elements within drawer cat chooser.
				$('#drawerCategories_'+myControl.util.makeSafeHTMLId(catSafeID)).addClass('selected'); //adds selected class to focus cat.
				$('#mobDrawerChooser_'+myControl.util.makeSafeHTMLId(catSafeID)).toggle(true); //makes prodlist for focus cat visible.
				
				if(myControl.ext.store_prodlist.util.buildProductList({"templateID":"mobDrawerProductSpec","parentID":"mobDrawerChooser_"+myControl.util.makeSafeHTMLId(catSafeID),"csv":myControl.data['appCategoryDetail|'+catSafeID]['@products']}))	{
					myControl.model.dispatchThis();
					}

//make drawers draggable. NOTE - the build_prodlist function needs to be expanded to include a onComplete function. something like that so that setTimeout can be avoided.
setTimeout("myControl.ext.myownersbox_configurator.util.makeDrawersDraggable()",3500);
				},




	
//executed when a drawer is clicked. could be clicked from step 3, recently viewed OR currently selected.
			drawerClicked : function(pid,parentID)	{
//				myControl.util.dump("ID for positioning = "+parentID);
				myControl.ext.myownersbox_configurator.util.disableDraggingOnSpots();
//add action on the spots so that, when clicked, they load the appropriate sku into the appropriate location in both the chooser and the preview.
				$('#selectedDrawerContainer li').each(function(index){
					$(this).addClass('dropItHere');
					$(this).click(function(event){
				//		myControl.util.dump(" -> drawer clicked. index +1 = "+(index+1)+" and pid = "+pid);
						event.preventDefault(); //cancels any action on the href. keeps anchor from jumping.
						myControl.ext.myownersbox_configurator.util.drawerAssignedToSpot(index+1,pid);
						myControl.ext.myownersbox_configurator.util.unbindSpotHotspots();
						});
					});
				
				}, //drawerClicked
			
			unbindSpotHotspots : function()	{
				myControl.ext.myownersbox_configurator.util.enableDraggingOnSpots();
				$('#selectedDrawerContainer li').each(function(index){
					$(this).removeClass('dropItHere').unbind('click');
					});
				},
			
			
			updateTotals : function()	{
//				myControl.util.dump("BEGIN customizer.util.updateTotals");
				$('#configuratorContainerTotal, #configuratorDrawerTotal, #configuratorTotal, #promotion').empty(); //make sure all totals are empty so summaries not updated don't show an old value

				var drawerSubtotal = 0;
				var containerPrice = 0;
				var numSpotsAvailable = 0; //# of spots in storage. all must be filled to qualify.
				var numDrawersSelected = 0; //# of drawers selected. incremented as ul is iterated through.
				$('#promotion').empty(); //clear existing promotion text. necessary when box size changes from big to small.
// HANDLE the storage container. need to know the price and also what size it is. the 1x3 is ignored for 'size' because it doesn't qualify for the promotion.
				var containerPID = $('#storageContainerProdlist .selected').attr('data-pid');
//				myControl.util.dump(" -> containerPID: "+containerPID);
				if(containerPID)	{
containerPrice = Number(myControl.data['appProductGet|'+containerPID]['%attribs']['zoovy:base_price']);
$('#configuratorContainerTotal').text("Storage Organizer: "+myControl.util.formatMoney(containerPrice,'$',2,true));
if(myControl.data['appProductGet|'+containerPID]['%attribs']['zoovy:prod_dimensions'] == '3x3')	{
	numSpotsAvailable = 9;
	}
else if(myControl.data['appProductGet|'+containerPID]['%attribs']['zoovy:prod_dimensions'] == '2x3')	{
	numSpotsAvailable = 6;
	}
else if(myControl.data['appProductGet|'+containerPID]['%attribs']['zoovy:prod_dimensions'] == '3x1')	{
	numSpotsAvailable = 3;
	}
else	{
	//no promotions for other sizes.
	}
	//     HANDLE the drawers. how many are selected and the subtotal
//loops through the list of selected drawers (right col of customizer)
$('#selectedDrawersList li').each(function(index){
//	myControl.util.dump(" -> spot "+($(this).index()+1)+" data-pid: "+$(this).attr('data-pid'));
	if($(this).attr('data-pid')) {
		numDrawersSelected += 1;
		drawerSubtotal += (myControl.data['appProductGet|'+$(this).attr('data-pid')]['%attribs']['zoovy:base_price'] * 1)
		}
	});
var orderTotal = (containerPrice*1)+(drawerSubtotal*1);

//myControl.util.dump(" -> dimensions of container: "+myControl.data['appProductGet|'+containerPID]['%attribs']['zoovy:prod_dimensions']);
//myControl.util.dump(" -> numDrawersSelected: "+numDrawersSelected);
//myControl.util.dump(" -> numSpotsAvailable: "+numSpotsAvailable);
//myControl.util.dump(" -> drawerSubtotal: "+drawerSubtotal);
//myControl.util.dump(" -> configuratorTotal: "+orderTotal);


if(numDrawersSelected > 0)	{
	$('#configuratorDrawerTotal').empty().text("Drawer Subtotal: "+myControl.util.formatMoney(drawerSubtotal,'$',2,true));
//if no bins are selected, no point even attempting to compute savings.
	if(numSpotsAvailable > 0)	{
		if(numSpotsAvailable == numDrawersSelected)	{
			$('#promotion').text("Your order qualifies for 15% off!");
			var savings = orderTotal - (orderTotal * .15);
			$('#configuratorTotal').html("<span class='linethrough'>"+myControl.util.formatMoney(orderTotal,'$',2,true)+"</span> - <b>15%</b>: "+myControl.util.formatMoney(savings,'$',2,true));
			}
		else	{
			$('#promotion').text("Add "+(numSpotsAvailable - numDrawersSelected)+" drawers to save 15%");
			$('#configuratorTotal').text("Total: "+myControl.util.formatMoney(orderTotal,'$',2,true));
			}
		}
	}
else	{
	$('#configuratorDrawerTotal').empty(); //hide at any zero. necessary when items are added and all are removed.
	}

					
					
					
					}
				else	{
					$('#configuratorDrawerTotal').empty(); //hide at any zero. necessary when items are added and all are removed.//no pid? odd.
					}

				},
			
			
//moves the chooser off the screen.
//need to position off instead of toggle, because .position() can't effect hidden elements.
			hideChooser: function()	{
				$('#drawerLocationChooser').position({
					of: $('#drawerLocationChooser'),
					offset: "-4000 -2000"
					});
				}, //hideChooser

/*
executed when a spot in the chooser is clicked.
will assign 'pid' to that spot, if pid is passed in.
if no pid, empties the spot. (this is how you'd reset a spot to blank)
data-pid is set/reset for each li.  Those are later used for adding items to the cart.
*/
			drawerAssignedToSpot : function(spot,pid)	{
//				myControl.util.dump("BEGIN myownersbox_configurator.util.drawerAssignedToSpot.");
//				myControl.util.dump(" -> spot = "+spot);
//				myControl.util.dump(" -> pid = "+pid);
				myControl.ext.myownersbox_configurator.vars.uriParams["s3d"+spot] = pid; //save to var object so that items populate when returning to page.
	

				var $previewSpot = $('#drawerLoc_'+spot).empty().attr('data-pid',''); 
				var $chooserSpot = $('#chooserDrawerLoc_'+spot).empty().attr('data-pid',''); 
//if no pid is passed, just empty the existing spots
				if(pid)	{
					var $dragContainer = $("<span class='draggable'>").attr('data-pid',pid).html(myControl.util.makeImage({"h":"131","w":"131","b":"ffffff","name":myControl.data['appProductGet|'+pid]['%attribs']['zoovy:prod_image7'],"tag":1}));
					$previewSpot.attr('data-pid',pid).append($dragContainer);
					$chooserSpot.attr('data-pid',pid).append(myControl.util.makeImage({"h":"35","w":"35","b":"ffffff","name":myControl.data['appProductGet|'+pid]['%attribs']['zoovy:prod_image1'],"tag":1}));
//needs to be done when drawer assigned so button 'resets' when an item is dragged from one spot to another.
//					myControl.ext.myownersbox_configurator.util.bindMouseover2Spot(spot); 
					
					
$dragContainer.draggable({ 
	zIndex: 999,				
	revert: 'invalid',
	snap: ".droppable",
	snapMode: "inner",
	containment: '#configuratorContainer',
	start : function(event, ui) {
//		myControl.util.dump(" INDEX: "+$(this).parent().index());
		$(this).attr("data-formerparentindex",$(this).parent().index());
		dropped = false;
		},
	stop: function(event, ui) {
		if (dropped==true) {
//			myControl.util.dump("$(this).data('formerParentIndex'): "+$(this).data('formerParentIndex'));
//			$(this).attr('data-formerparentindex','')
			}
		}
    });

					
					
					
					}
				else	{
//after emptying, put the spot # back in.
					$previewSpot.append("<span class='number noPrint'>"+spot+"</span>");
					}

				myControl.ext.myownersbox_configurator.util.addToSelectedUL(spot,pid);
				myControl.ext.myownersbox_configurator.util.updateTotals();
//				addthis_share.url = this.makeURL();
if(typeof addthis == 'object')	{
	addthis.update('share','url',this.makeURL()); //changed from line above on 2012-05-30
	}
//commented this line out on 2012-05-21. it nukes the vars. The vars are all maintained now much earlier in the process, so I don't think this is needed anymore.
//				myControl.ext.myownersbox_configurator.vars.uriParams =  myControl.util.getParametersAsObject(myControl.ext.myownersbox_configurator.util.buildURIVars());
				}, //drawerAssignedToSpot


//not used anymore.
			addToAllSpots : function(pid)	{
				var i;
				for(i = 1; i <= 9; i += 1)	{
//					myControl.util.dump("addToAllSpots i = "+i);
					myControl.ext.myownersbox_configurator.util.drawerAssignedToSpot(i,pid);
					}
					myControl.ext.myownersbox_configurator.util.hideChooser();
				}, //addToAllSpots

//will show a 'remove' button IF data-pid is set.  used for the 'spots' to allow for easy removal of a drawer once selected.
/*
			bindMouseover2Spot : function(spot)	{
				$('#drawerLoc_'+spot).mouseover(function(){
					$spot = $(this);
					myControl.util.dump(" => $spot.id: "+$spot.attr('id'));
					$spot.append($("<button>").text('X').addClass('removeButton').click(function(){
						myControl.util.dump(" -> remove button clicked.");
						myControl.ext.myownersbox_configurator.util.drawerAssignedToSpot($spot.index()+1,''); //pass blank to remove the item
						$spot.children('button').remove();
						}))
					}).mouseout(function(){$(this).children('button').remove()})
//.mouseout(function(){
//		$(this).children('button').remove();
//		});		
				},
*/

			addPIDToRecent : function(pid)	{
//inArray will return a -1 if false, then return the indexof, which potentially could be a 0
				if($.inArray(pid,myControl.ext.myownersbox_configurator.vars.recentlyRemoved) >= 0)	{
//					myControl.util.dump(" item "+pid+" is already in recentlyRemoved");
					}
				else if(pid != '')	{
//					myControl.util.dump("item "+pid+" being added to recentlyRemoved");
					myControl.ext.myownersbox_configurator.vars.recentlyRemoved.push(pid);
					}
				if(myControl.ext.myownersbox_configurator.vars.recentlyRemoved.length > 0)	{
//once recentlyViewed is populated, it gets displayed and rerendered with each change, so that the carousel updates.
					myControl.ext.store_prodlist.util.buildProductList({"templateID":"mobRecentViewedProductSpec","parentID":"recentlyRemovedProdlist","csv":myControl.ext.myownersbox_configurator.vars.recentlyRemoved,"items_per_page":200})
//merchant asked to have this removed on 2012-06-05. left all code so it could easily be readded. just uncomment this line.
//					$('#recentlyRemovedContainer').show(); //recentlyRemoved starts off hidden (because it's empty). make sure it's visible once populated.

				
					if(myControl.ext.myownersbox_configurator.vars.recentlyRemoved.length > 1)	{
//hidden by default so that the buttons don't show up when only 1 item is in list.
						$('#carouselPreviousBtn').toggle(true);
						$('#carouselNextBtn').toggle(true);
					
						$('#recentlyRemovedProdlist').cycle({
							fx:     'scrollHorz',
							speed:  'slow',
							timeout: 0, //disabled auto-play.
							prev:    '#prev',
							next:    '#next',
							pager:  '#recentlyRemovedProdlistNav',
							slideExpr: 'li'
							});
						}
					}
				}, //addPIDToRecent
			
			
//current dimensions are 3x3, 2x3 and 1x3.
//multiple H x W for # of spots
//dim is dimensions, passed in as WxH format (2x3)
			getSpotCountFromDimensions : function(dim)	{
				var r;
				var ints = dim.split('x');
				r = Number(ints[0])*Number(ints[1]);
				return r;
				},
				
				
//when a 'spot' is selected for a drawer, it gets added to the right column in a list of 'currently selected'.
//the ul and li's themselves are created in the view and updated here.
//this could/should be a template?  !!! look in to this.
//this function is also executed on init.
			addToSelectedUL : function(spot, pid)	{
				myControl.util.dump("spot: "+spot+" and pid: "+pid);
				var $spot = $('#selectedDrawerLoc_'+spot).removeClass('empty').removeClass('occupied').empty();
				var name,image,cssClass,price;
//if no pid is defined, then this spot is being emptied (or initially created).
				if(!pid)	{
					myControl.util.dump(" -> pid not set");
					name = 'Empty';
					pid = ''; //set to blank to make sure 'undefined' or 'null' are not output.
					cssClass = 'empty';
					price = '';
					image = 'blank';
//don't want to put a pid into recent on init.
//also only want to add it to the recently removed if an item is being removed (data-pid will be set once the spot is populated)
//					myControl.util.dump(" => spot.length = "+$spot.length);
//					myControl.util.dump(" => $spot.attr('data-pid') = "+$spot.attr('data-pid'));
//					myControl.util.dump(" => typeof $spot.attr('data-pid') = "+typeof $spot.attr('data-pid'));
					if(typeof $spot.attr('data-pid') == 'undefined'){} //no undefined items in recently viewed (could happen on app init)
					else{this.addPIDToRecent($spot.attr('data-pid'))};//data-pid is set when a spot is populated.
					}
				else	{
					name = myControl.data['appProductGet|'+pid]['%attribs']['user:prod_organization'] ? myControl.data['appProductGet|'+pid]['%attribs']['user:prod_organization'] : myControl.data['appProductGet|'+pid]['%attribs']['zoovy:prod_name'];
					cssClass = 'occupied';
					price = myControl.util.formatMoney(myControl.data['appProductGet|'+pid]['%attribs']['zoovy:base_price'],'$',2,true)
					image = myControl.data['appProductGet|'+pid]['%attribs']['zoovy:prod_image1'];
					}
				
				var o = "<div class='floatRight'><span class='number '>"+spot+"<\/span><button  onClick=\"myControl.ext.myownersbox_configurator.util.drawerAssignedToSpot('"+spot+"'); myControl.ext.myownersbox_configurator.util.hideChooser();\"";
				if(!pid)
					o += " disabled='disabled' "
				o += ">X<\/button><\/div><div onClick=\"myControl.ext.myownersbox_configurator.util.drawerClicked('"+pid+"','selectedDrawerLoc_"+spot+"')\">";
				o += myControl.util.makeImage({"h":"35","w":"35","b":"tttttt","name":image,"tag":1})
				o += "<div>"+name+"<br />"+price+"<\/div>";

//updates local storage. used if the user leaves the website and comes back.
				myControl.storageFunctions.writeLocal('configurator|uriParams',myControl.ext.myownersbox_configurator.vars.uriParams);
				
				
				$spot.addClass(cssClass).attr('data-pid',pid).append(o);
				}, //addToSelectedUL



/*
compose an object where {pid:quantityOfpid1,pid2:quantityOfpid2,pid3:quantityOfpid3}.
add a request for each pid/quantity to the immutable q.
dispatch.
*/

			addItAllToTheCart : function()	{
//				myControl.util.dump("BEGIN myownersbox_configurator.util.addItAllToTheCart");
				var r = 1;//returns a 1 or a 0 based on whether or not the configurator did or did not pass validation, respectively
				$('#addToCartBtn').attr('disabled','disabled');

				var obj = {};
				var temp;
				var numDrawers = 0; //total number of drawers added.
				$('#selectedDrawersList li').each(function(){
					temp = $(this).attr('data-pid');
//					myControl.util.dump(" -> temp = "+temp);
					if(temp)	{
						numDrawers += 1;
//add it to the obj if pid isn't already in there, otherwise increment existing value. same drawer may be in several spots.
						if(typeof obj[temp] == 'undefined')	{obj[temp] = 1}
						else	{obj[temp] += 1}
						}
					temp = '';
					})
				if(numDrawers < 2)	{
					$('#addToCartBtn').removeAttr('disabled').removeClass('ui-state-disabled');
					$('#configuratorAddToCartMessaging').append(myControl.util.formatMessage({'message':'Please select at least two drawers','htmlid':'configuratorAddToCartMessagingtmp','uiIcon':'notice','timeoutFunction':"$('#configuratorAddToCartMessagingtmp').slideUp(1000,function(){$(this).empty().remove()});"}));
					}
				else	{
					myControl.ext.myownersbox_configurator.calls.cartItemsAdd.init({"product_id":$('#storageContainerProdlist .selected').attr('data-pid'),"quantity":1});
					for(index in obj)	{
						myControl.ext.myownersbox_configurator.calls.cartItemsAdd.init({"product_id":index,"quantity":obj[index]});
						}
					myControl.calls.refreshCart.init({'callback':'displayCart','extension':'store_cart','parentID':'modalCartContents'},'immutable');
					myControl.model.dispatchThis('immutable');
					myControl.ext.myRIA.util.showCart();
					$('#modalCartContents').empty().remove(); //clear existing cart contents. 
					$('#modalCart').append(myControl.renderFunctions.createTemplateInstance('cartViewer',"modalCartContents")); //shows loading. preps for callback.
					$('#modalCart').prepend("<div id='configATCMessaging'></div>"); //used to display any errors from the addtocart requests
					}
//				myControl.util.dump(cmdObj);
				return r;
				},

//!!!
/*
get domain. split at ? if present to drop any existing key/value pairs.
there should be a separate funtion for creating the uri key/value pairs and this function should append it to the domain.
add extra params through kvpList.  ex:  &printme=1
*/
			makeURL : function(kvpList)	{
//				myControl.util.dump("BEGIN myownersbox_configurator.util.makeURl");
				var temp;

				var url = 'http://'+myControl.vars.sdomain+'/category/customizer/?'; //the url. what is returned.
				url += this.buildURIVars();
//				myControl.util.dump(" -> URL = "+url);
				url += kvpList ? kvpList : ''; //otherwise, undefined will appear at end of url.
				return url;
				},


			buildURIVars : function()	{
				var params = ''; //what is returned. a URI structured list of key/value pairs.
				var s1 = myControl.util.isSet($('#storageContainerCategories .selected').attr('data-catsafeid')) ? $('#storageContainerCategories .selected').attr('data-catsafeid') : ".storage-containers.major-league-baseball";
				var s2 = $('#storageContainerProdlist .selected').attr('data-pid');
				var s3 = $('#drawerCategories .selected').attr('data-catsafeid');

				params += "s1="+s1;
				if(s3)	{params += "&s3="+s3} //this is not required. if set, a drawer category will be open. otherwise, all will be closed.
				if(s2)	{
					params += "&s2="+s2; //storage bin sku.
//can't picks 'spots' without a storage container.
					$('#selectedDrawersList li').each(function(){
						temp = $(this).attr('data-pid');
						if(temp)	{
							params += "&s3d"+($(this).index()+1)+"="+temp;	
							}
						})
					}
				return params;
				},
//when a drawer is selected from spot3 by 'click', dragging needs to be disabled so that the 'click' to select doesn't register as a drag unintentionally
			disableDraggingOnSpots : function()	{
				$('#selectedDrawerContainer span.draggable').each(function(){
					$(this).draggable( 'disable' )
					})
				},
			
			enableDraggingOnSpots : function()	{
				$('#selectedDrawerContainer span.draggable').each(function(){
					$(this).draggable( 'enable' )
					})
				},

			openForPrinting : function()	{




//				myControl.util.dump("BEGIN myownersbox_customizer.util.openForPrinting");
//				adviceWin = window.open(myControl.ext.myownersbox_configurator.util.makeURL('&printme=1&SKIPPUSHSTATE=1'),'advice','status=no,width=600,height=600,menubar=no,scrollbars=yes');
//				adviceWin.focus(true);


				var containerPID = myControl.ext.myownersbox_configurator.vars.uriParams.s2;
				var imageID = myControl.data['appProductGet|'+containerPID]['%attribs']['zoovy:prod_image1'];
				
				
				window.print()
				},

/*
allows pre-population to occur. to set drawers into locations, style and size are required.
need to get the following pieces of data:
 -> appProductGet for all the skus (for each spot in the preview): s3dX where X = spot id.
 -> appProductGet for bin: s2
 -> getCategory for storagebincat: s1
 -> get other storage bins from selected bin cat: done off of callback on s1
 -> getCategory for open category for drawers (step3): s3
 -> appProductGet for all pids in open cat from step 3: done off on callback on s3

once obtained, needs to execute a callback that does the following:
select appropriate cat for #1
select appropriate storage container for step 2
if 'spots' are set, populate them everywhere they need to be populated.

*/
			popCustomerFromPresets : function() {
//				myControl.util.dump("BEGIN myownersbox_configurator.util.popCustomerFromPresets");
				var numRequests = 0; //the number of requests that will need to be made. returned.
				var P = myControl.ext.myownersbox_configurator.vars.uriParams; //shortcut.
//				myControl.util.dump(P);
//gets storage bin category detail (for step 1 so the list of product is available to pop step 2)
//product data retrieval and population is handled in a callback.
				if(myControl.util.isSet(P.s1))	{
//					myControl.util.dump(" -> s1 is populated ["+P.s1+"]");
					numRequests += myControl.ext.store_navcats.calls.appCategoryDetailMax.init(P.s1,{"callback":"containerCatSelected","extension":"myownersbox_configurator"});
					}


//				myControl.util.dump(" -> BEFORE LOOP. uriParams to follow: ");
//				myControl.util.dump(myControl.ext.myownersbox_configurator.vars.uriParams);


//the product info for P.s2 will be retrieved as part of the callback for appCategoryDetailMax above.
//gets product data each bin specified
				var i;
				for(i = 1; i <= 9; i +=1)	{
//					myControl.util.dump("['s3d"+i+"'] = "+myControl.ext.myownersbox_configurator.vars.uriParams['s3d'+i]);
					if(myControl.util.isSet(myControl.ext.myownersbox_configurator.vars.uriParams['s3d'+i]))	{
//						myControl.util.dump(" -> spot "+i+": "+myControl.ext.myownersbox_configurator.vars.uriParams['s3d'+i]);
						numRequests += myControl.ext.store_product.calls.appProductGet.init(myControl.ext.myownersbox_configurator.vars.uriParams['s3d'+i],{"callback":"addDrawerToSpot","extension":"myownersbox_configurator","spot":i})
						}
					}

//gets drawer category details (step 3) for 'openeing' the category and displaying the content.
//product data retrieval and population is handled in a callback.
				if(myControl.util.isSet(P.s3))	{
//					myControl.util.dump(" -> s3 is populated ["+P.s3+"]");
					numRequests += myControl.ext.store_navcats.calls.appCategoryDetailMax.init(P.s3,{"callback":"drawerCatSelected","extension":"myownersbox_configurator"}); 
					}
				return numRequests;
				}, //popCustomerFromPresets
				
				

			makeDrawersDraggable : function()	{
//myControl.util.dump("BEGIN myownersbox_customizer.util.makeDrawersDraggable");
/*
got much grief working this in a scrolly div.  here's the help:
http://stackoverflow.com/questions/2098387/jquery-ui-draggable-elements-not-draggable-outside-of-scrolling-div
the displayNone class is used on the drag icon so that it isn't displayed until this function is executed.
don't use a 'show()' because in a pad, this icon is always hidden... for now.
*/
$( ".draggable" ).removeClass('displayNone').draggable({ 
	zIndex: 999,				
	revert: 'invalid',
	helper: 'clone',
	scroll: false ,
	containment: '#configuratorContainer',
	appendTo: '#tagFun_div_helper',
	start : function(event, ui) {
//		myControl.util.dump(" -> you just grabbed pid:"+ui.helper.attr('data-pid'));
		dropped = false;
		ui.helper.find('.dragThumb').show();
		ui.helper.find('.dragIcon').hide();
		},
	stop: function(event, ui) {
		myControl.util.dump("STOP"); // the 'stop' is executed both when dropped on a 'droppable' and when dropped in an invalid location.
		if (dropped==true) {$(this).remove();}
		else {$(this).removeClass("hide");}
		}
    });
$( ".droppable" ).droppable({
	accept: '.draggable',
	hoverClass: 'tf_dropBox_hover',
	activeClass: 'dropItHere',
	drop: function(event, ui) {
		myControl.util.dump("DROP");
//		myControl.util.dump(" -> ui.attr('data-pid') : "+ui.draggable.attr('data-pid'));
//		myControl.util.dump(" -> new index : "+$(this).index());
		myControl.ext.myownersbox_configurator.util.drawerAssignedToSpot($(this).index()+1,ui.draggable.attr('data-pid'))
		if(ui.draggable.attr('data-formerparentindex'))	{
			myControl.ext.myownersbox_configurator.util.drawerAssignedToSpot((ui.draggable.attr('data-formerparentindex') *1)+1);
			}
		$('#selectedDrawerContainer .dropItHere').removeClass('dropItHere');
        }
    });

				}


			} //util



		
		} //r object.
	return r;
	}