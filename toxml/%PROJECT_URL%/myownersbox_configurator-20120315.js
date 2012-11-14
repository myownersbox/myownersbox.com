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
//		"uriParams" : myControl.util.getParametersAsObject(), //breaks IE.
		"templates" : ['mobDrawerChooser','mobStorageContainerProductSpec','mobStorageChooser','mobDrawerProductSpec','mobRecentViewedProductSpec'],
		"dependencies" : ['store_prodlist','store_navcats','store_product'], //a list of other extensions (just the namespace) that are required for this one to work.
		"dependAttempts" : 0 //used to count how many times the dependencies have been attempted.
		},

					////////////////////////////////////   CALLS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\		



	calls : {


		addToCart : {
			init : function(obj)	{
				this.dispatch(obj);
				return 1;
				},
			dispatch : function(obj)	{
				myControl.util.dump("BEGIN myControl.ext.myownersbox_configurator.calls.addToCart.dispatch");
				obj["_cmd"] = "addToCart"; 
				obj["_tag"] = {"callback":"itemAddedToCart","extension":"myownersbox_configurator"};
				myControl.model.addDispatchToQ(obj,'immutable');
				}
			} //addToCart
		
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
				if(myControl.ext.myownersboxRIA)	{
					myControl.ext.myownersboxRIA.util.addPushState({'pageType':'category','pageInfo':'.customizer'})
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
//				myControl.util.dump('BEGIN myControl.ext.myownersbox_configurator.callbacks.displayDrawers.onSuccess ');
//				myControl.util.dump(' -> datapointer = '+tagObj.datapointer);
//could use tagObj.datapointer.split('|')[0] instead of hard coding IF we need that flexibility. if not, just hard code it so no extra work has to be done (faster).
				if(myControl.ext.store_navcats.util.getChildDataOf('.drawers',{'parentID':'drawerCategories','callback':'addCatToDom','templateID':'mobDrawerChooser','extension':'store_navcats'},'categoryDetail')){myControl.model.dispatchThis()}
				
				$('#drawerCategories').removeClass('loadingBG');
				},
			onError : function(responseData,uuid)	{
				myControl.util.handleErrors(responseData,uuid)
				}
			},
			
//gets executed (eventually) once a category is selected in step 1. shows the product for that category.
		displayStorageContainers : {
			onSuccess : function(tagObj)	{
				myControl.util.dump('BEGIN myControl.ext.myownersbox_configurator.callbacks.displayStorageContainers.onSuccess ');
				myControl.util.dump(' -> datapointer = '+tagObj.datapointer);
//could use tagObj.datapointer.split('|')[0] instead of hard coding IF we need that flexibility. if not, just hard code it so no extra work has to be done (faster).
				myControl.ext.store_navcats.util.getChildDataOf('.storage-containers',{'parentID':'storageContainerCategories','callback':'addCatToDom','templateID':'mobStorageChooser','extension':'store_navcats'},'categoryDetailMax');
				
				for(i = 0; i < myControl.data['categoryDetail|.storage-containers'].subcategoryCount; i +=1)	{
					myControl.ext.store_prodlist.util.getProductDataForLaterUse(myControl.data['categoryDetail|.storage-containers']['@subcategoryDetail'][i]['@products']);
					}
				myControl.model.dispatchThis();
				myControl.model.dispatchThis('passive'); //the getforlateruse uses the passiveq.
				},
			onError : function(responseData,uuid)	{
				myControl.util.handleErrors(responseData,uuid)
				}
			}, //displayStorageContainers


		itemAddedToCart :	{
			onSuccess : function(tagObj)	{
				myControl.util.dump('BEGIN myControl.ext.store_product.callbacks.itemAddedToCart.onSuccess');
				$('#addToCartBtn').removeAttr('disabled').removeClass('ui-state-disabled');
				var htmlid = 'random_'+Math.floor(Math.random()*10001);
				$('#configuratorAddToCartMessaging').append(myControl.util.formatMessage({'message':'Added to cart','htmlid':htmlid,'uiIcon':'check','timeoutFunction':"$('#configuratorAddToCartMessagingtmp').slideUp(1000,function(){$(this).empty().remove()});"}));
				
				
				},
			onError : function(d)	{
				myControl.util.dump('BEGIN myControl.ext.store_product.callbacks.init.onError');
				$('#addToCartBtn').removeAttr('disabled').removeClass('ui-state-disabled').before(myControl.util.getResponseErrors(d))
				}
			
			}, //itemAddedToCart


// executed in popFromURI if s3 is set on uri
// will populate product in spot 2.
		containerCatSelected : {
			
			onSuccess : function(tagObj)	{
				myControl.ext.myownersbox_configurator.util.containerCatSelected(tagObj.datapointer.split('|')[1]);
				},
			onError : function(responseData,uuid)	{
				myControl.util.handleErrors(responseData,uuid)
				}
			
			},//containerCatSelected

// executed in popFromURI if s3 is set on uri
// will display preview in middle column and adjust number of 'spots' in selected drawers.
		containerSizeSelected : {
			onSuccess : function(tagObj)	{
				myControl.ext.myownersbox_configurator.util.containerSizeSelected(tagObj.datapointer.split('|')[1]);
				},
			onError : function(responseData,uuid)	{
				myControl.util.handleErrors(responseData,uuid)
				}
			}, //containerSizeSelected

// executed in popFromURI if s3 is set on uri
//will open one of the drawer categories and load product data.

		drawerCatSelected : {
			onSuccess : function(tagObj)	{
				myControl.ext.myownersbox_configurator.util.drawerCatSelected(tagObj.datapointer.split('|')[1]);
				},
			onError : function(responseData,uuid)	{
				myControl.util.handleErrors(responseData,uuid)
				}
			}, //drawerCatSelected

// executed in popFromURI if s3dX is set on uri, where X = spot id.
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
			
			initConfigurator : function(P) {
				myControl.util.dump('BEGIN myownersbox_configurator.actions.initConfigurator');
				
				$('#mainContentArea').empty().append(myControl.renderFunctions.transmogrify('configurator','configuratorTemplate',{}))

				var numRequests = 0; //will be 0 if a request is needed.
				myControl.ext.myownersbox_configurator.vars.uriParams = $.isEmptyObject(P) ? myControl.util.getParametersAsObject() : P;

//create empty placeholders for the 'currently selected' list in the right column.
//even if items are preselected, that's okay because they'll get updated later.
				for(i = 1; i <= 9; i +=1)	{
					myControl.ext.myownersbox_configurator.util.addToSelectedUL(i);
					}

//gets navcat info (thumbs, product, name, etc). uses this data for populating step 1 and 3 immidiately and step 2 once step 1 has been completed.
//each of these calls returns the number of requests needed. so if numRequests is zero, no dispatch needed.
				numRequests += myControl.ext.store_navcats.calls.categoryDetailMax.init('.storage-containers',{"callback":"displayStorageContainers","extension":"myownersbox_configurator"});
				numRequests += myControl.ext.store_navcats.calls.categoryDetailMax.init('.drawers',{"callback":"displayDrawers","extension":"myownersbox_configurator"});
				
				
				if(!$.isEmptyObject(myControl.ext.myownersbox_configurator.vars.uriParams))	{
					myControl.util.dump(" -> URI params present. Load presets.");
					myControl.ext.myownersbox_configurator.util.popFromURI();
					numRequests += 1; //make sure dispatch occurs. needed for popFromURI.

//if config is being opened for printing, hide left and right column.
					if(myControl.ext.myownersbox_configurator.vars.uriParams.printme == 1)	{
						$('#configuratorLeftColumn, #configuratorRightColumn').hide().width(1);
						$('#configuratorMiddleColumn').css('left',0);
						myControl.calls.ping.init({"callback":"printPage","extension":"myownersbox_configurator"});
						}
					
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
				$('#storageCatPrompt').empty().text(myControl.data['categoryDetail|'+catSafeID].pretty);

//the css hover menu doesn't close on click. This is a workaround. hides the dropdown, then turns it back on after two seconds.
				$('#storageContainerCategories').toggle(false);
				setTimeout("$('#storageContainerCategories').toggle(true);",2000);
				
				myControl.ext.myownersbox_configurator.util.hideChooser(); //closes an open chooser. feels natural when using to have this happen.
				if(numRequests = myControl.ext.store_prodlist.util.buildProductList({"templateID":"mobStorageContainerProductSpec","parentID":"storageContainerProdlist","csv":myControl.data['categoryDetail|'+catSafeID]['@products']})){
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
				var size = myControl.data['getProduct|'+pid]['%attribs']['zoovy:prod_dimensions'];
				myControl.ext.myownersbox_configurator.util.hideChooser(); //closes an open chooser. feels natural when using to have this happen.

				if(!size)	{
					myControl.util.dump("Warning! -> product "+pid+" may not have a size set");
					$('#selectedDrawerContainer').append(myControl.util.getResponseErrors('Uh Oh! Something went wrong. Please try refreshing the page. If the error persists, please let us know.'));
					}
				else	{

					var spots = myControl.ext.myownersbox_configurator.util.getSpotCountFromDimensions(size); // the # of spots available based on dimensions.
					
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
				
				if(myControl.ext.store_prodlist.util.buildProductList({"templateID":"mobDrawerProductSpec","parentID":"mobDrawerChooser_"+myControl.util.makeSafeHTMLId(catSafeID),"csv":myControl.data['categoryDetail|'+catSafeID]['@products']}))	{
					myControl.model.dispatchThis();
					}
//make drawers draggable. NOTE - the build_prodlist function needs to be expanded to include a onComplete function. something like that so that setTimeout can be avoided.
setTimeout("myControl.ext.myownersbox_configurator.util.makeDrawersDraggable()",1500);
				},




	
//executed when a drawer is clicked. could be clicked from step 3, recently viewed OR currently selected.
			drawerClicked : function(pid,parentID)	{
//				myControl.util.dump("ID for positioning = "+parentID);


				var x = $("#"+parentID).offset().left;
				//var y = $("#"+parentID).offset().top;
				var posOffset = x < 500 ? "200 -40" : "-220 - 40"; 


//add action to 'add to all' button so that it changes every 'spot' to the focus sku if clicked.
				$('#drawerChooserAddToAllBtn').click(function(event){
					event.preventDefault(); //cancels any action on the href. keeps anchor from jumping.
					myControl.ext.myownersbox_configurator.util.addToAllSpots(pid)
					});
				
//add action on the spots so that, when clicked, they load the appropriate sku into the appropriate location in both the chooser and the preview.
				$('#drawerLocationChooserListContainer li').each(function(index){
					$(this).click(function(event){
				//		myControl.util.dump(" -> drawer clicked. index +1 = "+(index+1)+" and pid = "+pid);
						event.preventDefault(); //cancels any action on the href. keeps anchor from jumping.
						myControl.ext.myownersbox_configurator.util.drawerAssignedToSpot(index+1,pid)
						});
					});
				
//adjust the location of the chooser to position itself off of the parent id.
//needs to determine X so that sides do not appear 'outside' a browser window.
//for now, Y isn't a concern because of the theme/wrapper used (big enough header to not worry yet).
				$('#drawerLocationChooser').position({
					of: $('#'+parentID),
					offset: posOffset
					});

				}, //drawerClicked
	
	
	

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
if no pid, empties the spot. (this is how you'd recent a spot to blank)
data-pid is set/reset for each li.  Those are later used for adding items to the cart.
*/
			drawerAssignedToSpot : function(spot,pid)	{
//				myControl.util.dump("BEGIN myownersbox_configurator.util.drawerAssignedToSpot.");
//				myControl.util.dump(" -> spot = "+spot);
//				myControl.util.dump(" -> pid = "+pid);

				var $previewSpot = $('#drawerLoc_'+spot).empty().attr('data-pid',''); 
				var $chooserSpot = $('#chooserDrawerLoc_'+spot).empty().attr('data-pid',''); 
//if no pid is passed, just empty the existing spots
				if(pid)	{
					$previewSpot.attr('data-pid',pid).append(myControl.util.makeImage({"h":"131","w":"131","bg":"ffffff","name":myControl.data['getProduct|'+pid]['%attribs']['zoovy:prod_image1'],"tag":1}));
					$chooserSpot.attr('data-pid',pid).append(myControl.util.makeImage({"h":"35","w":"35","bg":"ffffff","name":myControl.data['getProduct|'+pid]['%attribs']['zoovy:prod_image1'],"tag":1}));
					}
				else	{
//after emptying, put the spot # back in.
					$previewSpot.append("<span class='number'>"+spot+"</span>");
					
					}
				myControl.ext.myownersbox_configurator.util.addToSelectedUL(spot,pid);
				addthis_share.url = this.makeURL();

				}, //drawerAssignedToSpot



			addToAllSpots : function(pid)	{
				
				for(i = 1; i <= 9; i += 1)	{
					myControl.ext.myownersbox_configurator.util.drawerAssignedToSpot(i,pid);
					}
					myControl.ext.myownersbox_configurator.util.hideChooser();
				}, //addToAllSpots





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
				var name,image,cssClass;
//if no pid is defined, then this spot is being emptied (or initially created).
				if(!pid)	{
					name = 'Empty';
					pid = '';
					cssClass = 'empty';
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
					name = myControl.data['getProduct|'+pid]['%attribs']['user:prod_organization'] ? myControl.data['getProduct|'+pid]['%attribs']['zoovy:prod_name'] : myControl.data['getProduct|'+pid]['%attribs']['zoovy:prod_name'];
					cssClass = 'occupied';
					image = myControl.data['getProduct|'+pid]['%attribs']['zoovy:prod_image1'];
					}
				
				var o = "<div class='floatRight'><span class='number'>"+spot+"<\/span><button  onClick=\"myControl.ext.myownersbox_configurator.util.drawerAssignedToSpot('"+spot+"'); myControl.ext.myownersbox_configurator.util.hideChooser();\"";
				if(!pid)
					o += " disabled='disabled' "
				o += ">X<\/button><\/div><div onClick=\"myControl.ext.myownersbox_configurator.util.drawerClicked('"+pid+"','selectedDrawerLoc_"+spot+"')\">";
				o += myControl.util.makeImage({"h":"35","w":"35","bg":"ffffff","name":image,"tag":1})
				o += "<div>"+name+"<\/div>";
				
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
				$('#addToCartBtn').attr('disabled','disabled').addClass('ui-state-disabled');

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
					myControl.ext.myownersbox_configurator.calls.addToCart.init({"product_id":$('#storageContainerProdlist .selected').attr('data-pid'),"quantity":1});
					for(index in obj)	{
						myControl.ext.myownersbox_configurator.calls.addToCart.init({"product_id":index,"quantity":obj[index]});
						}
		
					myControl.model.dispatchThis('immutable');
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
				myControl.util.dump("BEGIN myownersbox_configurator.util.makeURl");
				var temp;
				var s1 = $('#storageContainerCategories .selected').attr('data-catsafeid');
				var s2 = $('#storageContainerProdlist .selected').attr('data-pid');
				var s3 = $('#storageContainerCategories .selected').attr('data-catsafeid');

				var url = 'http://'+myControl.vars.sdomain+'/category/customizer/?'; //the url. what is returned.
				url += "s1="+s1;
				if(s3)	{url += "&s3="+s3} //this is not required. if set, a drawer category will be open. otherwise, all will be closed.
				if(s2)	{
					url += "&s2="+s2; //storage bin sku.
//can't picks 'spots' without a storage container.
					$('#selectedDrawersList li').each(function(){
						temp = $(this).attr('data-pid');
						if(temp)	{
							url += "&s3d"+$(this).index()+"="+temp;	
							}
						})
					}
				myControl.util.dump(" -> URL = "+url);
				url += kvpList ? kvpList : ''; //otherwise, undefined will appear at end of url.
				return url;
				},

			openForPrinting : function()	{
				
				adviceWin = window.open(myControl.ext.myownersbox_configurator.util.makeURL('&printme=1&wrapper=~myownersbox_myownersboxcom_20120205'),'advice','status=no,width=600,height=600,menubar=no,scrollbars=yes');
				adviceWin.focus(true);
			
				},

/*
!!! incomplete. should probably be a utility. need to think about this piece some more.
allows pre-population to occur. to set drawers into locations, style and size are required.
need to get the following pieces of data:
 -> getProduct for all the skus (for each spot in the preview): s3dX where X = spot id.
 -> getProduct for bin: s2
 -> getCategory for storagebincat: s1
 -> get other storage bins from selected bin cat: done off of callback on s1
 -> getCategory for open category for drawers (step3): s3
 -> getProduct for all pids in open cat from step 3: done off on callback on s3

once obtained, needs to execute a callback that does the following:
select appropriate cat for #1
select appropriate storage container for step 2
if 'spots' are set, populate them everywhere they need to be populated.

*/
			popFromURI : function() {
				myControl.util.dump("BEGIN myownersbox_configurator.util.popFromURI");
				var numRequests = 0; //the number of requests that will need to be made. returned.
				var P = myControl.ext.myownersbox_configurator.vars.uriParams; //shortcut.
//gets storage bin category detail (for step 1 so the list of product is available to pop step 2)
//product data retrieval and population is handled in a callback.
				if(P.s1)	{
					myControl.util.dump(" -> s1 is populated");
					numRequests += myControl.ext.store_navcats.calls.categoryDetailMax.init(P.s1,{"callback":"containerCatSelected","extension":"myownersbox_configurator"});
					}

//a size is required for drawers to be populated.
				if(P.s2)	{
//gets storage-bin product data.
					myControl.util.dump(" -> s2 is populated");
					numRequests += myControl.ext.store_product.calls.getProduct.init(P.s2,{"callback":"containerSizeSelected","extension":"myownersbox_configurator"}) 
//gets product data each bin specified
					for(i = 1; i <= 9; i +=1)	{
						if(myControl.ext.myownersbox_configurator.vars.uriParams['s3d'+i])	{
							numRequests += myControl.ext.store_product.calls.getProduct.init(myControl.ext.myownersbox_configurator.vars.uriParams['s3d'+i],{"callback":"addDrawerToSpot","extension":"myownersbox_configurator","spot":i})
							}
						}
					}

//gets drawer category details (step 3) for 'openeing' the category and displaying the content.
//product data retrieval and population is handled in a callback.
				if(P.s3)	{
					myControl.util.dump(" -> s3 is populated");
					numRequests += myControl.ext.store_navcats.calls.categoryDetailMax.init(P.s3,{"callback":"drawerCatSelected","extension":"myownersbox_configurator"}); 
					}
				return numRequests;
				}, //popFromURI

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
		ui.helper.find('.ui-icon').hide();
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
		myControl.util.dump(" -> ui.attr('data-pid') : "+ui.draggable.attr('data-pid'));
		myControl.util.dump(" -> $(this).index() : "+$(this).index());
		myControl.ext.myownersbox_configurator.util.drawerAssignedToSpot($(this).index()+1,ui.draggable.attr('data-pid'))
        }
    });

				}


			} //util



		
		} //r object.
	return r;
	}