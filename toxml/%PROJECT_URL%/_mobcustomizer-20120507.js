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

/*
An extension for acquiring and displaying 'lists' of categories.
The functions here are designed to work with 'reasonable' size lists of categories.

To Do:
2. move small bg images into sprite-based classes.
3. taf.
4. 'save to link' function.
5. print me feature.
6. mouse over effect for 'remove'
8. social media buttons.
10. document that once a storage container is selected, add to cart IS clickable even if no drawers are selected. storage container gets added.
*/


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
//This extension needs to be able to operate without the mobRIA extension.
//so that if the configurator is loaded outside his website that ext isn't necessary.
				if(myControl.ext.myRIA)	{
					myControl.ext.myRIA.util.addPushState({'pageType':'category','pageInfo':'.customizer'})
					}
				myControl.ext.myownersbox_configurator.actions.initConfigurator(P);
				
				},
			onError : function(d)	{
				$('#globalMessaging').append(myControl.util.getResponseErrors(d)).toggle(true);
				}
			},


//simple enough.  used when page is printed. set printme=1 on URI.
		printPage : {
			onSuccess : function(tagObj)	{
				window.print()
				},
			onError : function(responseData,uuid)	{
				myControl.util.handleErrors(responseData,uuid)
				}
			},


//displays the list of subcategories for .drawers (step 3). gets applied to call during app init.
		displayDrawers : {
			onSuccess : function(tagObj)	{
				myControl.util.dump('BEGIN myownersbox_configurator.callbacks.displayDrawers.onSuccess ');
//				myControl.util.dump(' -> datapointer = '+tagObj.datapointer);
//could use tagObj.datapointer.split('|')[0] instead of hard coding IF we need that flexibility. if not, just hard code it so no extra work has to be done (faster).
				if(myControl.ext.store_navcats.util.getChildDataOf('.drawers',{'parentID':'drawerCategories','callback':'addCatToDom','templateID':'mobDrawerChooser','extension':'store_navcats'},'appCategoryDetail')){
					myControl.util.dump(" -> getChildDataOf for "+tagObj.datapointer+" was not all local. dispatching.");
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
				myControl.util.dump('BEGIN myControl.ext.store_product.callbacks.init.onError');
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
				
				$('#mainContentArea').empty().append(myControl.renderFunctions.transmogrify('configurator','configuratorTemplate',{}))

				var numRequests = 0; //will be 0 if a request is needed.
//handle presets.
//check if anything is already in memory. This would be set if the user has interacted w/ the customizer at all.
//this data should always be given priority because the user has set this up and for usability purposes, it should be consistent.
//they can always change or reconfigure it.
				if(!$.isEmptyObject(myControl.ext.myownersbox_configurator.vars.uriParams))	{
					//don't need to do anything here. uriParams is the var that gets used for all the processing.
					myControl.util.dump(" -> there are selections in memory. use them.");
					}
//P will be set if the shopper has clicked a link within the site and certain variables are set to preload.
				else if(!$.isEmptyObject(P))	{
					myControl.ext.myownersbox_configurator.vars.uriParams = P;
					myControl.util.dump(" -> use selections passed into function.");
					}
				else	{
					myControl.ext.myownersbox_configurator.vars.uriParams = myControl.util.getParametersAsObject();
					myControl.util.dump(" -> if selections are on URI, use them.");
					}

//if certain vars are not set, apply some defaults.
				if(!myControl.util.isSet(myControl.ext.myownersbox_configurator.vars.uriParams.s1))	{
					myControl.ext.myownersbox_configurator.vars.uriParams.s1 = ".storage-containers.major-league-baseball";
					}
				if(!myControl.util.isSet(myControl.ext.myownersbox_configurator.vars.uriParams.s2))	{
					myControl.ext.myownersbox_configurator.vars.uriParams.s2 = "50092MLB";
					}
				if(!myControl.util.isSet(myControl.ext.myownersbox_configurator.vars.uriParams.s3))	{
					myControl.ext.myownersbox_configurator.vars.uriParams.s3 = ".drawers.major-league-baseball";
					}

//create empty placeholders for the 'currently selected' list in the right column.
//even if items are preselected, that's okay because they'll get updated later.
				for(var i = 1; i <= 9; i +=1)	{
					myControl.ext.myownersbox_configurator.util.addToSelectedUL(i);
					}

//gets navcat info (thumbs, product, name, etc). uses this data for populating step 1 and 3 immidiately and step 2 once step 1 has been completed.
//each of these calls returns the number of requests needed. so if numRequests is zero, no dispatch needed.
				numRequests += myControl.ext.store_navcats.calls.appCategoryDetailMax.init('.storage-containers',{"callback":"displayStorageContainers","extension":"myownersbox_configurator"});
				numRequests += myControl.ext.store_navcats.calls.appCategoryDetailMax.init('.drawers',{"callback":"displayDrawers","extension":"myownersbox_configurator"});
				
				
				myControl.util.dump(" -> presets present. Load them.");
				myControl.ext.myownersbox_configurator.util.popCustomerFromPresets(); //***
				numRequests += 1; //make sure dispatch occurs. needed for popCustomerFromPresets.

//if config is being opened for printing, hide left and right column.
				if(myControl.ext.myownersbox_configurator.vars.uriParams.printme == 1)	{
					$('#configuratorLeftColumn, #configuratorRightColumn').hide().width(1);
					$('#configuratorMiddleColumn').css('left',0);
					myControl.calls.ping.init({"callback":"printPage","extension":"myownersbox_configurator"});
					}

				
				if(numRequests > 0)	{
					myControl.model.dispatchThis();  // if data above is in local, nothing will get dispatched.
					}

				addthis.toolbox('#configuratorAddThis');
				} //initConfigurator
			
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
				myControl.util.dump("BEGIN myownersbox_configurator.util.containerCatSelected");
				var numRequests = 0;
				myControl.util.dump("safeid = "+catSafeID);

				$('#storageContainerCategories li').removeClass('selected'); //selected class should only be set for one list item.
				$('#storageContainerCategories_'+myControl.util.makeSafeHTMLId(catSafeID)).addClass('selected'); //selected class used for makeURL function.

//puts category name at top of dropdown to make it obvious this item is in focus.
				$('#storageCatPrompt').empty().text(myControl.data['appCategoryDetail|'+catSafeID].pretty);

//the css hover menu doesn't close on click. This is a workaround. hides the dropdown, then turns it back on after a moment.
				$('#storageContainerCategories').toggle(false);
				setTimeout("$('#storageContainerCategories').toggle(true);",1000);
				
				myControl.ext.myownersbox_configurator.util.hideChooser(); //closes an open chooser. feels natural when using to have this happen.
				if(numRequests = myControl.ext.store_prodlist.util.buildProductList({"templateID":"mobStorageContainerProductSpec","parentID":"storageContainerProdlist","csv":myControl.data['appCategoryDetail|'+catSafeID]['@products']})){
					myControl.model.dispatchThis();
					}

				},

/*
executed when a 'storage container' product is clicked (step 2).  
this loads a preview image into the center column.
it will effect the number of list items in the 'currently selected' area.
it applies css classes to both the main preview window and the chooser, which crop to the correct size.
*/

			containerSizeSelected : function(pid)	{
				myControl.util.dump("pid = "+pid);
				$('#rightColDrawerContainer').show(); //once a container is selected, we know how many drawers spots to show in right col.
				$('#previewContainer').show(); //now we know what bin to show and how many spots. turn on preview.
				$('#drawerCategories').show();
				var size = myControl.data['appProductGet|'+pid]['%attribs']['zoovy:prod_dimensions'];
				myControl.ext.myownersbox_configurator.util.hideChooser(); //closes an open chooser. feels natural when using to have this happen.

				if(!size)	{
					myControl.util.dump("Warning! -> product "+pid+" may not have a size set");
					$('#globalMessaging').append(myControl.util.getResponseErrors('Error! product '+pid+' does not have a size set.'));
					}
				else	{

					var spots = myControl.ext.myownersbox_configurator.util.getSpotCountFromDimensions(size); // the # of spots available based on dimensions.
					var i;
					for(i = 0; i <= 9; i += 1) {
						if(i > spots)	{
//empty any spots after what is now available based on storage container dimesnions
							myControl.ext.myownersbox_configurator.util.drawerAssignedToSpot(i);
//							myControl.util.dump('hide #selectedDrawerLoc_'+i);
							$('#selectedDrawerLoc_'+i).toggle(false);
							}
						else	{
//make sure all spots are visible (important when switching from a 6 to 9, for example)
							$('#selectedDrawerLoc_'+i).toggle(true);
							}
						}
						
					
//this will apply a dimension specific class to the preview to crop the extra li items. They're still there, just invisible.
					$('#selectedDrawerContainer').removeClass().addClass('selectedDrawerContainer_'+size); 
//this will apply a dimension specific class to the spots in the chooser that crops the unnecessary li items. They're still there, just invisible.
					$('#drawerLocationChooserListContainer').removeClass().addClass('drawerLocationChooserListContainer_'+size); 

//NOTE = need to empty the extra spots. !!!

					$('#bgImageContainer').removeClass().addClass('bgImageContainer_'+size);
	//handle some styling.  the 'selected' class needs to be removed from all the product in the list and added to just the one now in focus.
					$('#storageContainerProdlist li').each(function() {
						myControl.util.dump(" -> removing class for ID "+$(this).attr('id'));
						$(this).removeClass('selected');
						});
					$('#storageContainerProdlist_'+pid).addClass('selected');
					addthis_share.url = this.makeURL();
					}
					
				},
	

	
//executed when a drawer category is selected.
//hides all the other product lists and shows the one now in focus.
			drawerCatSelected : function(catSafeID)	{
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
setTimeout("myControl.ext.myownersbox_configurator.util.makeDrawersDraggable()",1500);
				},




	
//executed when a drawer is clicked. could be clicked from step 3, recently viewed OR currently selected.
			drawerClicked : function(pid,parentID)	{
//				myControl.util.dump("ID for positioning = "+parentID);
				
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
				$('#selectedDrawerContainer li').each(function(index){
					$(this).removeClass('dropItHere').unbind('click');
					});
				},
			
			
			updateTotals : function()	{
				myControl.util.dump("BEGIN customizer.util.updateTotals");
				var drawerSubtotal = 0;
				var containerPrice = 0;
				var numSpotsAvailable = 0; //# of spots in storage. all must be filled to qualify.
				var numDrawersSelected = 0; //# of drawers selected. incremented as ul is iterated through.

/* HANDLE the storage container. need to know the price and also what size it is. the 1x3 is ignored for 'size' because it doesn't qualify for the promotion. */
				var containerPID = $('#storageContainerProdlist .selected').attr('data-pid');
				myControl.util.dump(" -> containerPID: "+containerPID);
				if(containerPID)	{
					containerPrice = Number(myControl.data['appProductGet|'+containerPID]['%attribs']['zoovy:base_price']);
					$('#configuratorContainerTotal').text("Storage Container: "+myControl.util.formatMoney(containerPrice,'$',2,true));
					if(myControl.data['appProductGet|'+containerPID]['%attribs']['zoovy:prod_dimensions'] == '3x3')	{
						numSpotsAvailable = 9;
						}
					else if(myControl.data['appProductGet|'+containerPID]['%attribs']['zoovy:prod_dimensions'] == '2x3')	{
						numSpotsAvailable = 6;
						}
					}

//     HANDLE the drawers. how many are selected and the subtotal
//loops through the list of selected drawers (right col of customizer)
				$('#selectedDrawersList li').each(function(index){
//					myControl.util.dump(" -> spot "+($(this).index()+1)+" data-pid: "+$(this).attr('data-pid'));
					if($(this).attr('data-pid')) {
						numDrawersSelected += 1;
						drawerSubtotal += (myControl.data['appProductGet|'+$(this).attr('data-pid')]['%attribs']['zoovy:base_price'] * 1)
						}
					});
					var orderTotal = (containerPrice*1)+(drawerSubtotal*1);


myControl.util.dump(" -> numDrawersSelected: "+numDrawersSelected);
myControl.util.dump(" -> numSpotsAvailable: "+numSpotsAvailable);
myControl.util.dump(" -> drawerSubtotal: "+drawerSubtotal);
myControl.util.dump(" -> configuratorTotal: "+orderTotal);


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
							$('#promotion').text("Add "+(numSpotsAvailable - numDrawersSelected)+" more drawers to save 15%");
							$('#configuratorTotal').text("Total: "+myControl.util.formatMoney(orderTotal,'$',2,true));
							}
						}
					}
				else	{
					$('#configuratorDrawerTotal').empty(); //hide at any zero. necessary when items are added and all are removed.
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
				myControl.util.dump("BEGIN myownersbox_configurator.util.drawerAssignedToSpot.");
				myControl.util.dump(" -> spot = "+spot);
				myControl.util.dump(" -> pid = "+pid);

				var $previewSpot = $('#drawerLoc_'+spot).empty().attr('data-pid',''); 
				var $chooserSpot = $('#chooserDrawerLoc_'+spot).empty().attr('data-pid',''); 
//if no pid is passed, just empty the existing spots
				if(pid)	{
					var $dragContainer = $("<span class='draggable'>").attr('data-pid',pid).html(myControl.util.makeImage({"h":"129","w":"129","bg":"tttttt","name":myControl.data['appProductGet|'+pid]['%attribs']['zoovy:prod_image2'],"tag":1}));
					$previewSpot.attr('data-pid',pid).append($dragContainer);
					$chooserSpot.attr('data-pid',pid).append(myControl.util.makeImage({"h":"35","w":"35","bg":"ffffff","name":myControl.data['appProductGet|'+pid]['%attribs']['zoovy:prod_image1'],"tag":1}));
//needs to be done when drawer assigned so button 'resets' when an item is dragged from one spot to another.
//					myControl.ext.myownersbox_configurator.util.bindMouseover2Spot(spot); 
					
					
$dragContainer.draggable({ 
	zIndex: 999,				
	revert: 'invalid',
	snap: ".droppable",
	snapMode: "inner",
	containment: '#configuratorContainer',
	start : function(event, ui) {
		myControl.util.dump(" INDEX: "+$(this).parent().index());
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
					$previewSpot.append("<span class='number'>"+spot+"</span>");
					}
				myControl.ext.myownersbox_configurator.util.addToSelectedUL(spot,pid);
				myControl.ext.myownersbox_configurator.util.updateTotals();
				addthis_share.url = this.makeURL();
				myControl.ext.myownersbox_configurator.vars.uriParams =  myControl.util.getParametersAsObject(myControl.ext.myownersbox_configurator.util.buildURIVars());
				}, //drawerAssignedToSpot


//not used anymore.
			addToAllSpots : function(pid)	{
				var i;
				for(i = 1; i <= 9; i += 1)	{
					myControl.util.dump("addToAllSpots i = "+i);
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
					myControl.util.dump(" item "+pid+" is already in recentlyRemoved");
					}
				else if(pid != '')	{
					myControl.util.dump("item "+pid+" being added to recentlyRemoved");
					myControl.ext.myownersbox_configurator.vars.recentlyRemoved.push(pid);
					}
				if(myControl.ext.myownersbox_configurator.vars.recentlyRemoved.length > 0)	{
//once recentlyViewed is populated, it gets displayed and rerendered with each change, so that the carousel updates.
					myControl.ext.store_prodlist.util.buildProductList({"templateID":"mobRecentViewedProductSpec","parentID":"recentlyRemovedProdlist","csv":myControl.ext.myownersbox_configurator.vars.recentlyRemoved,"items_per_page":200})
					$('#recentlyRemovedContainer').show(); //recentlyRemoved starts off hidden (because it's empty). make sure it's visible once populated.

				
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
				var $spot = $('#selectedDrawerLoc_'+spot).removeClass('empty').removeClass('occupied').empty();
				var name,image,cssClass,price;
//if no pid is defined, then this spot is being emptied (or initially created).
				if(!pid)	{
					name = 'Empty';
					pid = '';
					cssClass = 'empty';
					price = '';
					image = 'placeholders/empty_spot';
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
				
				var o = "<div class='floatRight'><span class='number'>"+spot+"<\/span><button  onClick=\"myControl.ext.myownersbox_configurator.util.drawerAssignedToSpot('"+spot+"'); myControl.ext.myownersbox_configurator.util.hideChooser();\"";
				if(!pid)
					o += " disabled='disabled' "
				o += ">X<\/button><\/div><div onClick=\"myControl.ext.myownersbox_configurator.util.drawerClicked('"+pid+"','selectedDrawerLoc_"+spot+"')\">";
				o += myControl.util.makeImage({"h":"35","w":"35","bg":"ffffff","name":image,"tag":1})
				o += "<div>"+name+" - "+price+"<\/div>";
				
				$spot.addClass(cssClass).attr('data-pid',pid).append(o);
				}, //addToSelectedUL



/*
compose an object where {pid:quantityOfpid1,pid2:quantityOfpid2,pid3:quantityOfpid3}.
add a request for each pid/quantity to the immutable q.
dispatch.
*/

			addItAllToTheCart : function()	{
				myControl.util.dump("BEGIN myownersbox_configurator.util.addItAllToTheCart");
				var r = 1;//returns a 1 or a 0 based on whether or not the configurator did or did not pass validation, respectively
				$('#addToCartBtn').attr('disabled','disabled');

				var obj = {};
				var temp;

				$('#selectedDrawersList li').each(function(){
					temp = $(this).attr('data-pid');
					myControl.util.dump(" -> temp = "+temp);
					if(temp)	{
//add it to the obj if pid isn't already in there, otherwise increment existing value. same drawer may be in several spots.
						if(typeof obj[temp] == 'undefined')	{obj[temp] = 1}
						else	{obj[temp] += 1}
						}
					temp = '';
					})
				if($.isEmptyObject(obj))	{
					$('#addToCartBtn').removeAttr('disabled').removeClass('ui-state-disabled');
					$('#configuratorAddToCartMessaging').append(myControl.util.formatMessage({'message':'Please select at least one drawer','htmlid':'configuratorAddToCartMessagingtmp','uiIcon':'notice','timeoutFunction':"$('#configuratorAddToCartMessagingtmp').slideUp(1000,function(){$(this).empty().remove()});"}));
					}
				else	{
					myControl.ext.myownersbox_configurator.calls.cartItemsAdd.init({"product_id":$('#storageContainerProdlist .selected').attr('data-pid'),"quantity":1});
					for(index in obj)	{
						myControl.ext.myownersbox_configurator.calls.cartItemsAdd.init({"product_id":index,"quantity":obj[index]});
						}
					myControl.ext.store_cart.calls.cartItemsList.init({'callback':'displayCart','extension':'store_cart','parentID':'modalCartContents'},'immutable');
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
				var s1 = $('#storageContainerCategories .selected').attr('data-catsafeid');
				var s2 = $('#storageContainerProdlist .selected').attr('data-pid');
				var s3 = $('#storageContainerCategories .selected').attr('data-catsafeid');

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

			openForPrinting : function()	{
				myControl.util.dump("BEGIN myownersbox_customizer.util.openForPrinting");
				adviceWin = window.open(myControl.ext.myownersbox_configurator.util.makeURL('&printme=1&wrapper=~myownersbox_myownersboxcom_20120205'),'advice','status=no,width=600,height=600,menubar=no,scrollbars=yes');
				adviceWin.focus(true);
			
				},

/*
### !!!! not working right after upgrade to 201218. sequencing issue.
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
				myControl.util.dump("BEGIN myownersbox_configurator.util.popCustomerFromPresets");
				var numRequests = 0; //the number of requests that will need to be made. returned.
				var P = myControl.ext.myownersbox_configurator.vars.uriParams; //shortcut.
//gets storage bin category detail (for step 1 so the list of product is available to pop step 2)
//product data retrieval and population is handled in a callback.
				if(myControl.util.isSet(P.s1))	{
					myControl.util.dump(" -> s1 is populated ["+P.s1+"]");
					numRequests += myControl.ext.store_navcats.calls.appCategoryDetailMax.init(P.s1,{"callback":"containerCatSelected","extension":"myownersbox_configurator"});
					}

//a size is required for drawers to be populated.
				if(myControl.util.isSet(P.s2))	{
//gets storage-bin product data.
					myControl.util.dump(" -> s2 is populated ["+P.s2+"]");
					numRequests += myControl.ext.store_product.calls.appProductGet.init(P.s2,{"callback":"containerSizeSelected","extension":"myownersbox_configurator"}) 
//gets product data each bin specified
					var i;
					for(i = 1; i <= 9; i +=1)	{
						if(myControl.util.isSet(myControl.ext.myownersbox_configurator.vars.uriParams['s3d'+i]))	{
							myControl.util.dump(" -> spot "+i+": "+myControl.ext.myownersbox_configurator.vars.uriParams['s3d'+i]);
							numRequests += myControl.ext.store_product.calls.appProductGet.init(myControl.ext.myownersbox_configurator.vars.uriParams['s3d'+i],{"callback":"addDrawerToSpot","extension":"myownersbox_configurator","spot":i})
							}
						}
					}

//gets drawer category details (step 3) for 'openeing' the category and displaying the content.
//product data retrieval and population is handled in a callback.
				if(myControl.util.isSet(P.s3))	{
					myControl.util.dump(" -> s3 is populated ["+P.s3+"]");
					numRequests += myControl.ext.store_navcats.calls.appCategoryDetailMax.init(P.s3,{"callback":"drawerCatSelected","extension":"myownersbox_configurator"}); 
					}
				return numRequests;
				}, //popCustomerFromPresets

			makeDrawersDraggable : function()	{

/*
got much grief working this in a scrolly div.  here's the help:
http://stackoverflow.com/questions/2098387/jquery-ui-draggable-elements-not-draggable-outside-of-scrolling-div
*/
$( ".draggable" ).draggable({ 
	zIndex: 999,				
	revert: 'invalid',
	helper: 'clone',
	scroll: false ,
	containment: '#configuratorContainer',
	appendTo: '#tagFun_div_helper',
	start : function(event, ui) {
		myControl.util.dump(" -> you just grabbed pid:"+ui.helper.attr('data-pid'));
		dropped = false;
		ui.helper.find('.dragThumb').show();
		ui.helper.find('.dragIcon').hide();
		},
	stop: function(event, ui) {
		if (dropped==true) {$(this).remove();}
		else {$(this).removeClass("hide");}
		}
    });
$( ".droppable" ).droppable({
	accept: '.draggable',
	hoverClass: 'tf_dropBox_hover',
	activeClass: 'dropItHere',
	drop: function(event, ui) {
//		myControl.util.dump(" -> ui.attr('data-pid') : "+ui.draggable.attr('data-pid'));
		myControl.util.dump(" -> new index : "+$(this).index());
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