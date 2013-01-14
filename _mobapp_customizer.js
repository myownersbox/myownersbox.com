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



var mob_customizer = function() {
  var r = {
    vars : {
      "currentCategory" : "",
      "currentDrawer": "",
      "recentlyRemoved" : [],
      "uriParams" : "", //stores a list of K/V pairs of what is selected in the customizer. used when a shopper returns to the page.
      "templates" : ['mobDrawerChooser','mobStorageContainerProductSpec','mobStorageChooser','mobDrawerProductSpec','mobRecentViewedProductSpec'],
      "dependencies" : ['store_prodlist','store_navcats','store_product'], //a list of other extensions (just the namespace) that are required for this one to work.
      "dependAttempts" : 0 //used to count how many times the dependencies have been attempted.
    },

    ////////////////////////////////////   CALLS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

    calls : {
      cartItemsAdd : {
        init : function(obj)  {
          this.dispatch(obj);
          return 1;
        },
        dispatch : function(obj)  {
        // app.u.dump("BEGIN app.ext.mob_customizer.calls.cartItemsAdd.dispatch");
          obj["_cmd"] = "cartItemsAdd";
          obj["_tag"] = {"callback":"itemAddedToCart","extension":"mob_customizer"};
          app.model.addDispatchToQ(obj,'immutable');
        }
      } //cartItemsAdd
      
    }, //calls

    ////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

    callbacks : {
      //callbacks.init need to return either a true or a false, depending on whether or not the file will execute properly based on store account configuration.
      init : {
        onSuccess : function()  {
          //        app.u.dump('BEGIN app.ext.store_navcats.init.onSuccess ');
          var r = true; //return false if extension won't load for some reason (account config, dependencies, etc).
          return r;
        },
        onError : function()  {
          app.u.dump('BEGIN app.ext.store_navcats.callbacks.init.onError');
        }
      },

      initConfigurator : {
        //to 'preconfigure' a configurator, pass in 'P' as an object just like format returned by getURIParams.
        //for a list of keys/values, see
        onSuccess : function(P) {
          app.ext.mob_customizer.actions.initConfigurator(P);
        },
        onError : function(d) {
          $('#globalMessaging').append(app.u.getResponseErrors(d)).toggle(true);
        }
      },

      //simple enough.  used when page is printed. set printme=1 on URI.
      printPage : {
        onSuccess : function(tagObj)  {
          var containerPID = app.ext.mob_customizer.vars.uriParams.s2;
          //        var imageID = app.data['appProductGet|'+containerPID]['%attribs']['zoovy:prod_image1'];
          //        $('#configuratorContainer').prepend("<div class='floatRight displayNone showInPrint'>"+app.u.makeImage({"h":"300","w":"300","b":"ffffff","name":imageID,"tag":1})+"<\/div>");
          window.print();
        },
        onError : function(responseData,uuid) {
          app.u.handleErrors(responseData,uuid);
        }
      },

      //displays the list of subcategories for .drawers (step 3). gets applied to call during app init.
      displayDrawers : {
        onSuccess : function(tagObj)  {
          //        app.u.dump('BEGIN mob_customizer.callbacks.displayDrawers.onSuccess ');
          //        app.u.dump(' -> datapointer = '+tagObj.datapointer);
          //could use tagObj.datapointer.split('|')[0] instead of hard coding IF we need that flexibility. if not, just hard code it so no extra work has to be done (faster).
          if(app.ext.store_navcats.u.getChildDataOf('.drawers',{'parentID':'drawerCategories','callback':'addCatToDom','templateID':'mobDrawerChooser','extension':'store_navcats'},'appCategoryDetail')){
            //          app.u.dump(" -> getChildDataOf for "+tagObj.datapointer+" was not all local. dispatching.");
            app.model.dispatchThis();
          }
            
          $('#drawerCategories').removeClass('loadingBG').show(); //make sure it's visible. with a default now in place, we always want these showing.
        },
        onError : function(responseData,uuid) {
          app.u.handleErrors(responseData,uuid);
        }
      },
        
      //gets executed (eventually) once a category is selected in step 1. shows the product for that category.
      displayStorageContainers : {
        onSuccess : function(tagObj)  {
                 // app.u.dump('BEGIN app.ext.mob_customizer.callbacks.displayStorageContainers.onSuccess ');
          //        app.u.dump(' -> datapointer = '+tagObj.datapointer);
          //could use tagObj.datapointer.split('|')[0] instead of hard coding IF we need that flexibility. if not, just hard code it so no extra work has to be done (faster).
          app.ext.store_navcats.u.getChildDataOf('.storage-containers',{'parentID':'storageContainerCategories','callback':'addCatToDom','templateID':'mobStorageChooser','extension':'store_navcats', 'hide_summary':'true'},'appCategoryDetailMax');
          //        for(var i = 0; i < app.data['appCategoryDetail|.storage-containers'].subcategoryCount; i +=1) {
          //          app.ext.store_prodlist.u.getProductDataForLaterUse(app.data['appCategoryDetail|.storage-containers']['@subcategoryDetail'][i]['@products']);
          //          }
          app.model.dispatchThis();
          //        app.model.dispatchThis('passive'); //the getforlateruse uses the passiveq.
        },
        onError : function(responseData,uuid) {
          app.u.handleErrors(responseData,uuid);
        }
      }, //displayStorageContainers

      itemAddedToCart : {
        onSuccess : function(tagObj)  {
          //do nothing for a successful add.  The cart, which is open on 'add to cart' will display this quite clearly.
        },
        onError : function(d) {
          //        app.u.dump('BEGIN app.ext.store_product.callbacks.init.onError');
          $('#addToCartBtn').removeAttr('disabled').removeClass('ui-state-disabled');
          $('#configATCMessaging').append(app.u.getResponseErrors(d));
        }
      }, //itemAddedToCart

      // executed in popCustomerFromPresets if s3 is set on uri
      // will populate product in spot 2.
      containerCatSelected : {
        onSuccess : function(tagObj)  {
          // app.u.dump('containerCatSelected success');
          // app.u.dump([tagObj]);
          app.ext.mob_customizer.u.containerCatSelected(tagObj.datapointer.split('|')[1]);
        },
        onError : function(responseData,uuid) {
          // app.u.dump('containerCatSelected error');
          app.u.handleErrors(responseData,uuid);
        }
      },//containerCatSelected

      // executed in popCustomerFromPresets if s3 is set on uri
      // will display preview in middle column and adjust number of 'spots' in selected drawers.
      containerSizeSelected : {
        onSuccess : function(tagObj)  {
          app.ext.mob_customizer.u.containerSizeSelected(tagObj.datapointer.split('|')[1]);
        },
        onError : function(responseData,uuid) {
          app.u.handleErrors(responseData,uuid);
        }
      }, //containerSizeSelected

      // executed in popCustomerFromPresets if s3 is set on uri
      //will open one of the drawer categories and load product data.

      drawerCatSelected : {
        onSuccess : function(tagObj)  {
          app.ext.mob_customizer.u.drawerCatSelected(tagObj.datapointer.split('|')[1]);
        },
        onError : function(responseData,uuid) {
          app.u.handleErrors(responseData,uuid);
        }
      }, //drawerCatSelected

      // executed in popCustomerFromPresets if s3dX is set on uri, where X = spot id.
      //will apply a draw to a 'spot', incuding necessary 'selected drawer' info in right col.
      addDrawerToSpot :{
        onSuccess : function(tagObj) {
          app.ext.mob_customizer.u.drawerAssignedToSpot(tagObj.spot,tagObj.datapointer.split('|')[1]);
        },
        onError : function(responseData,uuid) {
          app.u.handleErrors(responseData,uuid);
        }
      } //addDrawerToSpot
      
    }, //callbacks





    actions : {
      /*
      content for the pre-populating the customizer could come from 3 locations and are 'obeyed' in this order:

      passed in from memory (shopper interacted with customizer, left page, then returned)
      passed directly into the function (linking from within site).
      passed on the URI (external links to page)

      */
      initConfigurator : function(P) {
        // app.u.dump('BEGIN mob_customizer.actions.initConfigurator');
        // app.u.dump([P]);
        //This extension needs to be able to operate without the mobRIA extension.
        //so that if the configurator is loaded outside his website that ext isn't necessary.
        //init could get executed not through 'showContent', so hide the banner and show the cats.
        // $('#headerBanner').hide(); // handled in init
        // $('#headerCategories').show(); // handled in init
        $('#mastHead .promotionFree').hide();
        $('#mastHead .promotion15Off').show();

        if(app.ext.myRIA) {
          app.ext.myRIA.u.addPushState({'pageType':'category','navcat':'.customizer'});
        }

        $('#mainContentArea').empty().append(app.renderFunctions.transmogrify('configurator','configuratorTemplate',{}));

        var numRequests = 0; //will be > 0 if a request is needed.

        //handle presets.
        //variables passed in should be given priority, as per Sandy
        //next, default to what is in memory.
        //lastly, check url.
        // ### SANITY - url 'may' have been nuked by pop/push state by now. but uri vars are handled through handleAppInit
        if(!$.isEmptyObject(P)) {
          app.ext.mob_customizer.vars.uriParams = $.extend(app.ext.mob_customizer.vars.uriParams,P);
          //        app.u.dump(" -> use selections passed into function.");
          //        app.u.dump(app.ext.mob_customizer.vars.uriParams);
        }
        else if(!$.isEmptyObject(app.ext.mob_customizer.vars.uriParams))  {
          //don't need to do anything here. uriParams is the var that gets used for all the processing.
          //        app.u.dump(" -> there are selections in memory. use them.");
          //        app.u.dump(app.ext.mob_customizer.vars.uriParams);
        }
        else if(app.storageFunctions.readLocal('configurator|uriParams')) {
          //        app.u.dump(" -> there are selections in localStorage (from a previous visit).");
          app.ext.mob_customizer.vars.uriParams = app.storageFunctions.readLocal('configurator|uriParams');
          //        app.u.dump(app.ext.mob_customizer.vars.uriParams);
        }
        else  {
          app.ext.mob_customizer.vars.uriParams = app.u.getParametersAsObject(document.location.href.split('?')[1]);
          //          app.u.dump(" -> if selections are on URI, use them.");
        }

        app.ext.mob_customizer.vars.uriParams.printMe = null; //never set printme in uriParams. could cause accidental execution of print code.

        //if certain vars are not set, apply some defaults.
        if(!app.u.isSet(app.ext.mob_customizer.vars.uriParams.s1))  {
          app.ext.mob_customizer.vars.uriParams.s1 = ".storage-containers.major-league-baseball";
          //          app.u.dump(" -> no storage organizer category set. use default.");
        }
        if(!app.u.isSet(app.ext.mob_customizer.vars.uriParams.s2))  {
          app.ext.mob_customizer.vars.uriParams.s2 = "50092MLB";
          //          app.u.dump(" -> no storage organizer product set. use default.");
        }
        if(!app.u.isSet(app.ext.mob_customizer.vars.uriParams.s3))  {
          app.ext.mob_customizer.vars.uriParams.s3 = ".drawers.major-league-baseball";
          //          app.u.dump(" -> no drawer category set. use default.");
        }



        //gets navcat info (thumbs, product, name, etc). uses this data for populating step 1 and 3 immidiately and step 2 once step 1 has been completed.
        //each of these calls returns the number of requests needed. so if numRequests is zero, no dispatch needed.
        //get the details on the open drawer category. saves an extra request. also solves a transmogrify sequencing issue if it's added 2 the Q first.
        numRequests += app.ext.store_navcats.calls.appCategoryDetailMax.init(app.ext.mob_customizer.vars.uriParams.s3);
        //there's only 3 bins right now. we're inevitably going to need this data. get it now when a request is most likely happening anyway.
        numRequests += app.ext.store_product.calls.appProductGet.init('50062MLB');
        numRequests += app.ext.store_product.calls.appProductGet.init('50092MLB');
        numRequests += app.ext.store_product.calls.appProductGet.init('60032MLB');
        
        
        numRequests += app.ext.store_navcats.calls.appCategoryDetailMax.init('.storage-containers',{"callback":"displayStorageContainers","extension":"mob_customizer"});
        numRequests += app.ext.store_navcats.calls.appCategoryDetailMax.init('.drawers',{"callback":"displayDrawers","extension":"mob_customizer"});
        numRequests += app.ext.mob_customizer.u.popCustomerFromPresets();

        //      app.u.dump(" -> numRequests for customizer.init = "+numRequests);
        if(numRequests > 0) {
          app.model.dispatchThis();  // if data above is in local, nothing will get dispatched.
        }

        if(typeof addthis == 'object')  {
          // app.u.dump([addthis]);
          addthis.toolbox('#configuratorAddThis');
        }
      }, //initConfigurator
      
      //guts of this found here: http://www.dynamicdrive.com/dynamicindex9/addbook.htm
      bookmarkThis : function() {
        var title = "MyOwnersBox.com - My Customized Storage Container";
        var url = app.ext.mob_customizer.u.makeURL();
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
      },


        
      show360Viewer : function(url) {
        var fullURL = url; //make sure the url has a protocol. helps for local testing and native apps.
        var protocol = location.protocol == 'https' ? 'https' : 'http:'; //default protocol to use. will be overridden if https
        if(url.indexOf('//') === 0)  {
          fullURL = protocol+url;
        }
        $('<div>').attr('title','360 viewer').dialog({modal:true,width:'90%',height:$(window).height() - 100}).html("<iframe src="+fullURL+" width='610' height='670' />");
        return true;
      }
    }, // end actions



    ////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

    renderFormats : {

      showIfSetInlineBlock : function($tag,data) {
        //      app.u.dump('BEGIN control.renderFormats.hideorShowTab');
        //      app.u.dump(' -> data.value'+data.value);
        if(data.value)  {
          //        app.u.dump(' -> setting $tag.show()');
          $tag.show().css('display','inline-block'); //IE isn't responding to the 'show', so the display:block is added as well.
          }
        },

      //the link should ONLy appear if the sku is a storageContainer.
      //in this case, more than one attribute is needed, so the pid is passed in and the product data object is looked up.
      //since in a product list, the product data 'may' not be in memory yet, and else is present if data not available.
      linkToConfigurator : function($tag,data)  {
        // app.u.dump([data]);
        if(app.data['appProductGet|'+data.value]) {
          var pData = app.data['appProductGet|'+data.value]['%attribs'];
          var pid = data.value;
          if(pData['zoovy:prod_dimensions'] && pData['user:prod_organization'] && app.ext.mob_customizer.u.guessContainerParentCat(pid))  {
            $tag.addClass('pointer').click(function(){
              app.ext.mob_customizer.actions.initConfigurator({'s1':app.ext.mob_customizer.u.guessContainerParentCat(pid),'s2':pid});
              return false;
            }).append("<span class='spriteBG addContainerLink'></span>");
          }
          else  {
            //dimensions aren't set, prod_organization isn't set, or container cat can't be determined.
            //          app.u.dump("-> dimensions ["+pData['zoovy:prod_dimensions']+"], organization ["+pData['user:prod_organization']+"] or parent cat ["+app.ext.myRIA.u.guessContainerParentCat(pid)+"] can't be determined.");
          }
        }
        else  {
          //product data not available. do nothing. no need to report this because it is likely a 'list'
        }
      },
      drawerPromotion: function($tag,data)  {
        /*
        merchant has a promotion where if enough drawers are purchased to fill the storage bin (which also must be purchase),
        then a 15% discount is applied to the order. This function will return whether or not the order qualifies (true of false) based
        on whether or not a storage bin is in the cart.  It will also auto-update a div in the cart with 'qualifies' or 'only X more to qualify).
        */
        app.u.dump("BEGIN myRIA.u.promotionalContent");
        
        var hasContainer = false; //will be set to true if cart contains storage container. if not, no discount is available.
        var numSpots = 0; //# of spots in storage. all must be filled to qualify.
        var numDrawers = 0; //# of drawers in cart.
        
        if(!$.isEmptyObject(app.data.cartItemsList.cart.stuff)) {
          for(var index in app.data.cartItemsList.cart.stuff) {
            if(app.data.cartItemsList.cart.stuff[index].full_product['zoovy:prod_dimensions']){
                hasContainer=true;
              if(app.data.cartItemsList.cart.stuff[index].full_product['zoovy:prod_dimensions'] == '3x3') {
                numSpots = 9;
              }
              else if(app.data.cartItemsList.cart.stuff[index].full_product['zoovy:prod_dimensions'] == '2x3')  {
                numSpots = 6;
              }
              else if(app.data.cartItemsList.cart.stuff[index].full_product['zoovy:prod_dimensions'] == '3x1')  {
                numSpots = 3;
              }
              else  {
                //unknown dimensions.
              }
            }
            if(app.data.cartItemsList.cart.stuff[index].full_product['is:user1']) {
              numDrawers += app.u.isSet(app.data.cartItemsList.cart.stuff[index].qty) ? (app.data.cartItemsList.cart.stuff[index].qty * 1): 1;
              numDrawers += 1;
            }
          }
            
          //          app.u.dump(" -> hasContainer: "+hasContainer);
          //          app.u.dump(" -> numSpots: "+numSpots);
          //          app.u.dump(" -> numDrawers: "+numDrawers);

          if(hasContainer)  {
            if(numDrawers > 0 && numDrawers >= numSpots)  {
              $tag.append("Your order qualifies for 15% off!");
            }
            else  {
              //was having NAN issues with numSpots - numDrawers, so used toFixed to be sure vars were treated as integers.
              $tag.append("Add "+(numSpots.toFixed(0) - numDrawers.toFixed(0))+" more drawers to receive 15% off your storage organizer");
            }
          }
        }
        return hasContainer;
      },
        
      view360inModal : function($tag,data)  {
        //        app.u.dump("BEGIN myRIA.renderFormats.view360inModal");
        //        app.u.dump(" -> data.value: "+data.value);
        $tag.removeClass('displayNone').addClass('pointer');
        $tag.click(function(){
        //          app.u.dump("viewer clicked. add event here. no. add it in the sho360viewer action.");
          app.ext.mob_customizer.actions.show360Viewer(data.value);
        });
        //function got nuked as part of crappy internet in office.  is in local backup on that machine 20120529
      } //view360inModal
    }, // end renderformats

    ////////////////////////////////////   u    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

    u : {

      //tries to guess which storage container category is most appropriate for this category.
      guessContainerParentCat : function(pid) {
        var r,org;
        org = app.data['appProductGet|'+pid]['%attribs']['user:prod_organization'];
        if(org) {
          if(org == 'MLB'){r = '.storage-containers.major-league-baseball';}
          else if(org == 'NFL'){r = '.storage-containers.national-football-league';}
          else{r = false;}
        }
        else  {r = false;}
        return r;
      },

      /*
      executed when a 'storage container' category is clicked (step 1).  it will show a list of storage containers for step 2.
      it will also close the chooser, if it's open.
      */
      containerCatSelected : function(catSafeID)  {
        // app.u.dump("BEGIN mob_customizer.u.containerCatSelected");
        var numRequests = 0;
        // app.u.dump("safeid = "+catSafeID);

        // if already current, don't show
        if (!r.vars.currentCategory || r.vars.currentCategory != catSafeID) {
          // app.u.dump('not current');


          $('#storageContainerCategories li').removeClass('selected'); //selected class should only be set for one list item.
          $('#storageContainerCategories_'+app.u.makeSafeHTMLId(catSafeID)).addClass('selected'); //selected class used for makeURL function.

          //puts category name at top of dropdown to make it obvious this item is in focus.
          $('#storageCatPrompt').empty().text(app.data['appCategoryDetail|'+catSafeID].pretty);

          //the css hover menu doesn't close on click. This is a workaround. hides the dropdown, then turns it back on after a moment.
          $('#storageContainerCategories').toggle(false);
          setTimeout("$('#storageContainerCategories').toggle(true);",1000);
          //the container size code needs to happen after the product list is built, otherwise 'classes' assigned are overwritten w/ transmogrify.



          // app.u.dump(" -> before containerSizeSelected function executed. uriParams follow: ");
          // app.u.dump([app.ext.mob_customizer.vars.uriParams]);

          numRequests = app.ext.store_prodlist.u.buildProductList({"templateID":"mobStorageContainerProductSpec","parentID":"storageContainerProdlist","loadsTemplate":"mobStorageContainerProductSpec","csv":app.data['appCategoryDetail|'+catSafeID]['@products'], 'hide_summary':'true'});
          if(numRequests){
            app.calls.ping.init({"callback":"containerSizeSelected","extension":"mob_customizer","datapointer":"appProductGet|"+app.ext.mob_customizer.vars.uriParams.s2});
            app.model.dispatchThis();
          }
          else  {
            //no dispatch is occuring because all data is in memory. execute the code handled in the ping above.
            if(app.ext.store_product.calls.appProductGet.init(app.ext.mob_customizer.vars.uriParams.s2,{'callback':'containerSizeSelected','extension':'mob_customizer'}))  {app.model.dispatchThis();}
          }
        }

        app.ext.mob_customizer.u.hideChooser(); // closes an open chooser. feels natural when using to have this happen.

        r.vars.currentCategory = catSafeID; // set current for next

        //        app.u.dump(" -> END mob_customizer.u.containerCatSelected. uriParams to follow: ");
        //        app.u.dump(app.ext.mob_customizer.vars.uriParams);
      },

      /*
      executed when a 'storage container' product is clicked (step 2).
      this loads a preview image into the center column.
      it will effect the number of list items in the 'currently selected' area.
      it applies css classes to both the main preview window and the chooser, which crop to the correct size.
      product data should already be in memory by the time this executes.
      */

      containerSizeSelected : function(pid) {
        //        app.u.dump("BEGIN mobcustomizer.u.containerSizeSelected ["+pid+"]. uriParams to follow");
        //        app.u.dump(app.ext.mob_customizer.vars.uriParams);
        
        app.ext.mob_customizer.vars.uriParams.s2 = pid;
        //        app.u.dump("container pid = "+pid);
        $('#rightColDrawerContainer').show(); //once a container is selected, we know how many drawers spots to show in right col.
        $('#previewContainer').show(); //now we know what bin to show and how many spots. turn on preview.
        $('#drawerCategories').show(); //make sure drawers are visible.
        var size = app.data['appProductGet|'+pid]['%attribs']['zoovy:prod_dimensions'];

        //        app.ext.mob_customizer.u.hideChooser(); //closes an open chooser. feels natural when using to have this happen.
        if(!size) {
          //          app.u.dump("Warning! -> product "+pid+" may not have a size set");
          $('#globalMessaging').append(app.u.getResponseErrors('Error! product '+pid+' does not have a size set.'));
        }
        else  {
          var spots = app.ext.mob_customizer.u.getSpotCountFromDimensions(size); // the # of spots available based on dimensions.

          //          app.u.dump(" -> size: "+size);
          //          app.u.dump(" -> spots: "+spots);

          //empty the extra spots.

          for(var i = 1; i <= 9; i += 1) {
            if(i > spots) {
              //              app.u.dump(" -> RESET for spot "+i);
              //if the user changes from a 9 to a six or three of from a six to a three, the 'extra' spots need to be emptied.
              //otherwise, they 'stay' in the totals and product list, et all.
              app.ext.mob_customizer.u.drawerAssignedToSpot(i);
              $('#selectedDrawerLoc_'+i).toggle(false);
            }
            else  {
              //need to 'try' to populate here so that if blank, the 'empty' placeholder will show up. otherwise these spots in 'selected' just shows blank.
              // added 2012-06-15
              //              app.ext.mob_customizer.u.drawerAssignedToSpot(i,app.ext.mob_customizer.vars.uriParams["s3d"+i]);
              //make sure all spots are visible (important when switching from a 6 to 9, for example)
              $('#selectedDrawerLoc_'+i).show();
            }
          }
        
          //this will apply a dimension specific class to the preview to crop the extra li items. They're still there, just invisible.
          $('#selectedDrawerContainer').removeClass().addClass('selectedDrawerContainer_'+size);
          //this will apply a dimension specific class to the spots in the chooser that crops the unnecessary li items. They're still there, just invisible.
          $('#drawerLocationChooserListContainer').removeClass().addClass('drawerLocationChooserListContainer_'+size);

          //          $('#bgImageContainer').removeClass().addClass('bgImageContainer_'+size);
          // CHANGED on 20120523. needed the bgimage to print, so just adding image instead of a class.
          $('#bgImageContainer').empty().append("<img src='images/mbo_conf_bg-429x429-"+size+".png' />");
          
          //handle some styling.  the 'selected' class needs to be removed from all the product in the list and added to just the one now in focus.
          $('#storageContainerProdlist li').each(function() {
            //            app.u.dump(" -> removing class for ID "+$(this).attr('id'));
            $(this).removeClass('selected');
          });
          $('#storageContainerProdlist_'+pid).addClass('selected');
          this.updateTotals();
          //adjustment to 'page'-specific addthis code for addThis.  pinterest requires an image and url to be passed.
          if(typeof addthis_share == 'object')  {
            var url = this.makeURL();
            //  url = url.replace('?','---'); //commented out on 2012-07-08. not sure what this is or why it's here, but TAF isn't working so see if this helpts.
            addthis_share.url = url;
            $("#socialLinks .addthis_button_facebook_like").attr("fb:like:href",url);
            $("#socialLinks .addthis_button_pinterest_pinit").attr({"pi:pinit:media":app.u.makeImage({"h":"300","w":"300","b":"ffffff","name":app.data['appProductGet|'+pid]['%attribs']['zoovy:prod_image1'],"tag":0}),"pi:pinit:url":url});
          }
        }
      },
  
      //executed when a drawer category is selected.
      //hides all the other product lists and shows the one now in focus.
      drawerCatSelected : function(catSafeID) {
        // app.u.dump("BEGIN customizer.u.drawerCatSelected");
        // app.u.dump("safeid = "+catSafeID);
        app.ext.mob_customizer.u.hideChooser(); //closes an open chooser. feels natural when using to have this happen.
        $('#drawerCategories .prodlist').toggle(false); // hide all the other product lists.
        $('#drawerCategories li').removeClass('selected'); //remove selected class from all list elements within drawer cat chooser.
        $('#drawerCategories_'+app.u.makeSafeHTMLId(catSafeID)).addClass('selected'); //adds selected class to focus cat.
        $('#mobDrawerChooser_'+app.u.makeSafeHTMLId(catSafeID)).toggle(true); //makes prodlist for focus cat visible.

        // if drawers already show, don't show again
        // if drawers already loaded, don't load more
        // app.u.dump($('#mobDrawerChooser_'+app.u.makeSafeHTMLId(catSafeID)).children('li').length);
        if ((!r.vars.currentDrawer || r.vars.currentDrawer != catSafeID) && $('#mobDrawerChooser_'+app.u.makeSafeHTMLId(catSafeID)).children('li').length === 0 ) {
          if(app.ext.store_prodlist.u.buildProductList({"templateID":"mobDrawerProductSpec","parentID":"mobDrawerChooser_"+app.u.makeSafeHTMLId(catSafeID),"loadsTemplate":"mobDrawerProductSpec", "hide_summary": "true" ,"csv":app.data['appCategoryDetail|'+catSafeID]['@products']})) {
            app.model.dispatchThis();
          }
        }
        r.vars.currentDrawer = catSafeID;

        

        //make drawers draggable. NOTE - the build_prodlist function needs to be expanded to include a onComplete function. something like that so that setTimeout can be avoided.
        setTimeout("app.ext.mob_customizer.u.makeDrawersDraggable()",3500);
      },

      //executed when a drawer is clicked. could be clicked from step 3, recently viewed OR currently selected.
      drawerClicked : function(pid,parentID)  {
        //        app.u.dump("ID for positioning = "+parentID);
        app.ext.mob_customizer.u.disableDraggingOnSpots();
        //add action on the spots so that, when clicked, they load the appropriate sku into the appropriate location in both the chooser and the preview.
        $('#selectedDrawerContainer li').each(function(index){
          $(this).addClass('dropItHere');
          $(this).click(function(event){
          //    app.u.dump(" -> drawer clicked. index +1 = "+(index+1)+" and pid = "+pid);
            event.preventDefault(); //cancels any action on the href. keeps anchor from jumping.
            app.ext.mob_customizer.u.drawerAssignedToSpot(index+1,pid);
            app.ext.mob_customizer.u.unbindSpotHotspots();
          });
        });
        
      }, //drawerClicked
      
      unbindSpotHotspots : function() {
        app.ext.mob_customizer.u.enableDraggingOnSpots();
        $('#selectedDrawerContainer li').each(function(index){
          $(this).removeClass('dropItHere').unbind('click');
          });
      },
      
      
      updateTotals : function() {
        //        app.u.dump("BEGIN customizer.u.updateTotals");
        $('#configuratorContainerTotal, #configuratorDrawerTotal, #configuratorTotal, #promotion').empty(); //make sure all totals are empty so summaries not updated don't show an old value
        var drawerSubtotal = 0;
        var containerPrice = 0;
        var numSpotsAvailable = 0; //# of spots in storage. all must be filled to qualify.
        var numDrawersSelected = 0; //# of drawers selected. incremented as ul is iterated through.
        $('#promotion').empty(); //clear existing promotion text. necessary when box size changes from big to small.
        // HANDLE the storage container. need to know the price and also what size it is. the 1x3 is ignored for 'size' because it doesn't qualify for the promotion.
        var containerPID = $('#storageContainerProdlist .selected').attr('data-pid');
        //        app.u.dump(" -> containerPID: "+containerPID);
        if(containerPID)  {
          containerPrice = Number(app.data['appProductGet|'+containerPID]['%attribs']['zoovy:base_price']);
          $('#configuratorContainerTotal').text("Storage Organizer: "+app.u.formatMoney(containerPrice,'$',2,true));
          if(app.data['appProductGet|'+containerPID]['%attribs']['zoovy:prod_dimensions'] == '3x3') {
            numSpotsAvailable = 9;
          }
          else if(app.data['appProductGet|'+containerPID]['%attribs']['zoovy:prod_dimensions'] == '2x3')  {
            numSpotsAvailable = 6;
          }
          else if(app.data['appProductGet|'+containerPID]['%attribs']['zoovy:prod_dimensions'] == '3x1')  {
            numSpotsAvailable = 3;
          }
          else  {
            //no promotions for other sizes.
          }
          //     HANDLE the drawers. how many are selected and the subtotal
          //loops through the list of selected drawers (right col of customizer)
          $('#selectedDrawersList li').each(function(index){
          //  app.u.dump(" -> spot "+($(this).index()+1)+" data-pid: "+$(this).attr('data-pid'));
            if($(this).attr('data-pid')) {
              numDrawersSelected += 1;
              drawerSubtotal += (app.data['appProductGet|'+$(this).attr('data-pid')]['%attribs']['zoovy:base_price'] * 1);
            }
          });
          var orderTotal = (containerPrice*1)+(drawerSubtotal*1);
          //app.u.dump(" -> dimensions of container: "+app.data['appProductGet|'+containerPID]['%attribs']['zoovy:prod_dimensions']);
          //app.u.dump(" -> numDrawersSelected: "+numDrawersSelected);
          //app.u.dump(" -> numSpotsAvailable: "+numSpotsAvailable);
          //app.u.dump(" -> drawerSubtotal: "+drawerSubtotal);
          //app.u.dump(" -> configuratorTotal: "+orderTotal);
          if(numDrawersSelected > 0)  {
            $('#configuratorDrawerTotal').empty().text("Drawer Subtotal: "+app.u.formatMoney(drawerSubtotal,'$',2,true));
            //if no bins are selected, no point even attempting to compute savings.
            if(numSpotsAvailable > 0) {
              if(numSpotsAvailable == numDrawersSelected) {
                $('#promotion').text("Your order qualifies for 15% off!");
                var savings = orderTotal - (orderTotal * 0.15);
                $('#configuratorTotal').html("<span class='linethrough'>"+app.u.formatMoney(orderTotal,'$',2,true)+"</span> - <b>15%</b>: "+app.u.formatMoney(savings,'$',2,true));
              }
              else  {
                $('#promotion').text("Add "+(numSpotsAvailable - numDrawersSelected)+" drawers to save 15%");
                $('#configuratorTotal').text("Total: "+app.u.formatMoney(orderTotal,'$',2,true));
              }
            }
          }
          else  {
            $('#configuratorDrawerTotal').empty(); //hide at any zero. necessary when items are added and all are removed.
          }
        }
        else  {
          $('#configuratorDrawerTotal').empty(); //hide at any zero. necessary when items are added and all are removed.//no pid? odd.
        }
      }, // end updateTotals
      
      
      //moves the chooser off the screen.
      //need to position off instead of toggle, because .position() can't effect hidden elements.
      hideChooser: function() {
        // app.u.dump('hiding chooser');
        $('#drawerLocationChooser').position({
          of: $('#drawerLocationChooser'),
          at: "center",
          offset: "-4000 -2000"
        });
        // app.u.dump('hidden');
      }, //hideChooser

      /*
      executed when a spot in the chooser is clicked.
      will assign 'pid' to that spot, if pid is passed in.
      if no pid, empties the spot. (this is how you'd reset a spot to blank)
      data-pid is set/reset for each li.  Those are later used for adding items to the cart.
      */
      drawerAssignedToSpot : function(spot,pid) {
        // app.u.dump("BEGIN mob_customizer.u.drawerAssignedToSpot.");
        // app.u.dump(" -> spot = "+spot);
        // app.u.dump(" -> pid = "+pid);
        app.ext.mob_customizer.vars.uriParams["s3d"+spot] = pid; //save to var object so that items populate when returning to page.
        var $previewSpot = $('#drawerLoc_'+spot).empty().attr('data-pid','');
        var $chooserSpot = $('#chooserDrawerLoc_'+spot).empty().attr('data-pid','');
        //if no pid is passed, just empty the existing spots
        if(pid) {
          var $dragContainer = $("<span class='draggable'>").attr('data-pid',pid).html(app.u.makeImage({"h":"131","w":"131","b":"ffffff","name":app.data['appProductGet|'+pid]['%attribs']['zoovy:prod_image7'],"tag":1}));
          $previewSpot.attr('data-pid',pid).append($dragContainer);
          $chooserSpot.attr('data-pid',pid).append(app.u.makeImage({"h":"35","w":"35","b":"ffffff","name":app.data['appProductGet|'+pid]['%attribs']['zoovy:prod_image1'],"tag":1}));
          //needs to be done when drawer assigned so button 'resets' when an item is dragged from one spot to another.
          //          app.ext.mob_customizer.u.bindMouseover2Spot(spot);
          
          
          $dragContainer.draggable({
            zIndex: 999,
            revert: 'invalid',
            snap: ".droppable",
            snapMode: "inner",
            containment: '#configuratorContainer',
            start : function(event, ui) {
              app.u.dump(" INDEX: "+$(this).parent().index());
              $(this).attr("data-formerparentindex",$(this).parent().index());
              dropped = false;
              _gaq.push(['_trackEvent', 'Customizer', 'Drag', 'Move Within Organizer']);
            },
            stop: function(event, ui) {
              if (dropped === true) {
                app.u.dump("$(this).data('formerParentIndex'): "+$(this).data('formerParentIndex'));
                $(this).attr('data-formerparentindex','');
              }
            }
          });
        }
        else  {
          //after emptying, put the spot # back in.
          $previewSpot.append("<span class='number noPrint'>"+spot+"</span>");
        }

        app.ext.mob_customizer.u.addToSelectedUL(spot,pid);
        app.ext.mob_customizer.u.updateTotals();
        
        if(typeof addthis == 'object' && addthis.update)  {
          addthis.update('share','url',this.makeURL()); //implemented on 2012-05-30 (used to just set addthis_share.url)
          }
        // addthis.update stopped working on 2012-09-12. Left the code because it seems error proof. added the following as well
        if(typeof addthis_share == 'object')  {
          addthis_share.url = this.makeURL();
          }
        //commented this line out on 2012-05-21. it nukes the vars. The vars are all maintained now much earlier in the process, so I don't think this is needed anymore.
        //        app.ext.mob_customizer.vars.uriParams =  app.u.getParametersAsObject(app.ext.mob_customizer.u.buildURIVars());
      }, //drawerAssignedToSpot


      //not used anymore.
      addToAllSpots : function(pid) {
        var i;
        for(i = 1; i <= 9; i += 1)  {
          //          app.u.dump("addToAllSpots i = "+i);
          app.ext.mob_customizer.u.drawerAssignedToSpot(i,pid);
        }
        app.ext.mob_customizer.u.hideChooser();
      }, //addToAllSpots

      //will show a 'remove' button IF data-pid is set.  used for the 'spots' to allow for easy removal of a drawer once selected.
      /*
            bindMouseover2Spot : function(spot) {
              $('#drawerLoc_'+spot).mouseover(function(){
                $spot = $(this);
                app.u.dump(" => $spot.id: "+$spot.attr('id'));
                $spot.append($("<button>").text('X').addClass('removeButton').click(function(){
                  app.u.dump(" -> remove button clicked.");
                  app.ext.mob_customizer.u.drawerAssignedToSpot($spot.index()+1,''); //pass blank to remove the item
                  $spot.children('button').remove();
                  }))
                }).mouseout(function(){$(this).children('button').remove()})
      //.mouseout(function(){
      //    $(this).children('button').remove();
      //    });
              },
      */

      addPIDToRecent : function(pid)  {
        /*
        feature removed.
        //inArray will return a -1 if false, then return the indexof, which potentially could be a 0
                if($.inArray(pid,app.ext.mob_customizer.vars.recentlyRemoved) >= 0) {
        //          app.u.dump(" item "+pid+" is already in recentlyRemoved");
                  }
                else if(pid != '')  {
        //          app.u.dump("item "+pid+" being added to recentlyRemoved");
                  app.ext.mob_customizer.vars.recentlyRemoved.push(pid);
                  }
                if(app.ext.mob_customizer.vars.recentlyRemoved.length > 0)  {
        //once recentlyViewed is populated, it gets displayed and rerendered with each change, so that the carousel updates.
                  app.ext.store_prodlist.u.buildProductList({"templateID":"mobRecentViewedProductSpec","parentID":"recentlyRemovedProdlist","csv":app.ext.mob_customizer.vars.recentlyRemoved,"items_per_page":200})
        //merchant asked to have this removed on 2012-06-05. left all code so it could easily be readded. just uncomment this line.
        //          $('#recentlyRemovedContainer').show(); //recentlyRemoved starts off hidden (because it's empty). make sure it's visible once populated.

                
                  if(app.ext.mob_customizer.vars.recentlyRemoved.length > 1)  {
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
        */
      }, //addPIDToRecent
      
      
      //current dimensions are 3x3, 2x3 and 1x3.
      //multiple H x W for # of spots
      //dim is dimensions, passed in as WxH format (2x3)
      getSpotCountFromDimensions : function(dim)  {
        var r;
        var ints = dim.split('x');
        r = Number(ints[0])*Number(ints[1]);
        return r;
      },
        
        
      //create a empty spot for the right column. If P.pid isn't set, an empty spot will be created.
      //function is executed in a loop during app init to create empty spots.
      //also executed as part of addToSelectedUL()
      selectedULTemplate : function(spot,P) {
        //        app.u.dump("BEGIN customizer.u.selectedULTemplate ["+spot+"]");
        if($.isEmptyObject(P) || !app.u.isSet(P.pid)) {
          P.name = 'Empty';
          P.pid = ''; //set to blank to make sure 'undefined' or 'null' are not output.
          P.cssClass = 'empty';
          P.price = '';
          P.image = 'blank';
        }
        var o = "<div class='floatRight'><span class='number '>"+spot+"<\/span><button  onClick=\"app.ext.mob_customizer.u.drawerAssignedToSpot('"+spot+"'); app.ext.mob_customizer.u.hideChooser();\"";
        if(!P.pid)
          o += " disabled='disabled' ";
        o += ">X<\/button><\/div><div onClick=\"app.ext.mob_customizer.u.drawerClicked('"+P.pid+"','selectedDrawerLoc_"+spot+"')\">";
        o += app.u.makeImage({"h":"35","w":"35","b":"tttttt","name":P.image,"tag":1});
        o += "<div>"+P.name+"<br />"+P.price+"<\/div>";
        return o;
      },
        
        
      //when a 'spot' is selected for a drawer, it gets added to the right column in a list of 'currently selected'.
      //the ul and li's themselves are created in the view and updated here.
      //this could/should be a template?  !!! look in to this.
      //this function is also executed on init.
      addToSelectedUL : function(spot, pid) {
        // app.u.dump("spot: "+spot+" and pid: "+pid);
        var $spot = $('#selectedDrawerLoc_'+spot).removeClass('empty').removeClass('occupied').empty();
        var name,image,cssClass,price;
        //if no pid is defined, then this spot is being emptied (or initially created).
        if(!pid)  {
          pid = ''; //set to blank so any values set to pid are set to blank.
          cssClass = 'empty';
          //          app.u.dump(" -> pid not set");
          //values for P in selectedULTemplate are set within that function
          if(typeof $spot.attr('data-pid') == 'undefined'){} //no undefined items in recently viewed (could happen on app init)
          else{this.addPIDToRecent($spot.attr('data-pid'));}//data-pid is set when a spot is populated.
          }
        else  {
          name = app.data['appProductGet|'+pid]['%attribs']['user:prod_organization'] ? app.data['appProductGet|'+pid]['%attribs']['user:prod_organization'] : app.data['appProductGet|'+pid]['%attribs']['zoovy:prod_name'];
          cssClass = 'occupied';
          price = app.u.formatMoney(app.data['appProductGet|'+pid]['%attribs']['zoovy:base_price'],'$',2,true);
          image = app.data['appProductGet|'+pid]['%attribs']['zoovy:prod_image1'];
        }
        
        var o = this.selectedULTemplate(spot,{'name':name,'pid':pid,'cssClass':cssClass,'price':price,'image':image});

        //updates local storage. used if the user leaves the website and comes back.
        app.storageFunctions.writeLocal('configurator|uriParams',app.ext.mob_customizer.vars.uriParams);
        
        
        $spot.addClass(cssClass).attr('data-pid',pid).append(o);
      }, //addToSelectedUL



      /*
      compose an object where {pid:quantityOfpid1,pid2:quantityOfpid2,pid3:quantityOfpid3}.
      add a request for each pid/quantity to the immutable q.
      dispatch.
      */

      addItAllToTheCart : function()  {
        //        app.u.dump("BEGIN mob_customizer.u.addItAllToTheCart");
        var r = 1;//returns a 1 or a 0 based on whether or not the configurator did or did not pass validation, respectively
        $('#addToCartBtn').attr('disabled','disabled');

        var obj = {};
        var temp;
        var numDrawers = 0; //total number of drawers added.
        $('#selectedDrawersList li').each(function(){
          temp = $(this).attr('data-pid');
          //          app.u.dump(" -> temp = "+temp);
          if(temp)  {
            numDrawers += 1;
            //add it to the obj if pid isn't already in there, otherwise increment existing value. same drawer may be in several spots.
            if(typeof obj[temp] == 'undefined') {obj[temp] = 1;}
            else  {obj[temp] += 1;}
          }
          temp = '';
        });
        if(numDrawers < 2)  {
          $('#addToCartBtn').removeAttr('disabled').removeClass('ui-state-disabled');
          $('#configuratorAddToCartMessaging').append(app.u.formatMessage({'message':'Please select at least two drawers','htmlid':'configuratorAddToCartMessagingtmp','uiIcon':'notice','timeoutFunction':"$('#configuratorAddToCartMessagingtmp').slideUp(1000,function(){$(this).empty().remove()});"}));
          
          _gaq.push(['_trackEvent', 'Customizer', 'Add to Cart', 'Fail (2 drawer minimum)']);
          
        }
        else  {
          app.ext.mob_customizer.calls.cartItemsAdd.init({"product_id":$('#storageContainerProdlist .selected').attr('data-pid'),"quantity":1});
          for(var index in obj) {
            app.ext.mob_customizer.calls.cartItemsAdd.init({"product_id":index,"quantity":obj[index]});
          }
          app.calls.refreshCart.init({'callback':'displayCart','extension':'store_cart','parentID':'modalCartContents'},'immutable');
          app.model.dispatchThis('immutable');
          app.ext.myRIA.u.showCart();
          $('#modalCartContents').empty().remove(); //clear existing cart contents.
          $('#modalCart').append(app.renderFunctions.createTemplateInstance('cartTemplate',"modalCartContents")); //shows loading. preps for callback.
          $('#modalCart').prepend("<div id='configATCMessaging'></div>"); //used to display any errors from the addtocart requests
          
          _gaq.push(['_trackEvent', 'Customizer', 'Add to Cart', 'Success']);
          
        }
        //        app.u.dump(cmdObj);
        return r;
      },

      //!!!
      /*
      get domain. split at ? if present to drop any existing key/value pairs.
      there should be a separate funtion for creating the uri key/value pairs and this function should append it to the domain.
      add extra params through kvpList.  ex:  &printme=1
      */
      makeURL : function(kvpList) {
        //        app.u.dump("BEGIN mob_customizer.u.makeURl");
        var temp;

        var url = 'http://'+app.vars.sdomain+'/category/customizer/?'; //the url. what is returned.
        url += this.buildURIVars();
        //        app.u.dump(" -> URL = "+url);
        url += kvpList ? kvpList : ''; //otherwise, undefined will appear at end of url.
        return url;
      },


      buildURIVars : function() {
        var params = ''; //what is returned. a URI structured list of key/value pairs.
        var s1 = app.u.isSet($('#storageContainerCategories .selected').attr('data-catsafeid')) ? $('#storageContainerCategories .selected').attr('data-catsafeid') : ".storage-containers.major-league-baseball";
        var s2 = $('#storageContainerProdlist .selected').attr('data-pid');
        var s3 = $('#drawerCategories .selected').attr('data-catsafeid');

        params += "s1="+s1;
        if(s3)  {params += "&s3="+s3;} //this is not required. if set, a drawer category will be open. otherwise, all will be closed.
        if(s2)  {
          params += "&s2="+s2; //storage bin sku.
          //can't picks 'spots' without a storage container.
          $('#selectedDrawersList li').each(function(){
            temp = $(this).attr('data-pid');
            if(temp)  {
              params += "&s3d"+($(this).index()+1)+"="+temp;
            }
          });
        }
        return params;
        },
        //when a drawer is selected from spot3 by 'click', dragging needs to be disabled so that the 'click' to select doesn't register as a drag unintentionally
      disableDraggingOnSpots : function() {
        $('#selectedDrawerContainer span.draggable').each(function(){
          $(this).draggable( 'disable' );
        });
      },
      
      enableDraggingOnSpots : function()  {
        $('#selectedDrawerContainer span.draggable').each(function(){
          $(this).draggable( 'enable' );
        });
      },

      openForPrinting : function()  {
        //        app.u.dump("BEGIN myownersbox_customizer.u.openForPrinting");
        //        adviceWin = window.open(app.ext.mob_customizer.u.makeURL('&printme=1&SKIPPUSHSTATE=1'),'advice','status=no,width=600,height=600,menubar=no,scrollbars=yes');
        //        adviceWin.focus(true);
        var containerPID = app.ext.mob_customizer.vars.uriParams.s2;
        var imageID = app.data['appProductGet|'+containerPID]['%attribs']['zoovy:prod_image1'];
        
        
        window.print();
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
        app.u.dump("BEGIN mob_customizer.u.popCustomerFromPresets");
        var numRequests = 0; //the number of requests that will need to be made. returned.
        var P = app.ext.mob_customizer.vars.uriParams; //shortcut.
        //        app.u.dump(P);
        //gets storage bin category detail (for step 1 so the list of product is available to pop step 2)
        //product data retrieval and population is handled in a callback.
        if(app.u.isSet(P.s1)) {
          // app.u.dump(" -> s1 is populated ["+P.s1+"]");
          numRequests += app.ext.store_navcats.calls.appCategoryDetailMax.init(P.s1,{"callback":"containerCatSelected","extension":"mob_customizer"});
          }


        // app.u.dump(" -> BEFORE LOOP. uriParams to follow: ");
        //        app.u.dump(app.ext.mob_customizer.vars.uriParams);


        //the product info for P.s2 will be retrieved as part of the callback for appCategoryDetailMax above.
        //gets product data each bin specified
        var i;
        for(i = 1; i <= 9; i +=1) {
          //          app.u.dump("['s3d"+i+"'] = "+app.ext.mob_customizer.vars.uriParams['s3d'+i]);
          if(app.u.isSet(app.ext.mob_customizer.vars.uriParams['s3d'+i])) {
            //            app.u.dump(" -> spot "+i+": "+app.ext.mob_customizer.vars.uriParams['s3d'+i]);
            numRequests += app.ext.store_product.calls.appProductGet.init(app.ext.mob_customizer.vars.uriParams['s3d'+i],{"callback":"addDrawerToSpot","extension":"mob_customizer","spot":i});
          }
          else  {
            this.drawerAssignedToSpot(i); //creates empties.
          }
        }

        //gets drawer category details (step 3) for 'openeing' the category and displaying the content.
        //product data retrieval and population is handled in a callback.
        if(app.u.isSet(P.s3)) {
          //          app.u.dump(" -> s3 is populated ["+P.s3+"]");
          numRequests += app.ext.store_navcats.calls.appCategoryDetailMax.init(P.s3,{"callback":"drawerCatSelected","extension":"mob_customizer"});
        }
        return numRequests;
      }, //popCustomerFromPresets
        
        

      makeDrawersDraggable : function() {
        //app.u.dump("BEGIN myownersbox_customizer.u.makeDrawersDraggable");
        /*
        got much grief working this in a scrolly div.  here's the help:
        http://stackoverflow.com/questions/2098387/jquery-ui-draggable-elements-not-draggable-outside-of-scrolling-div
        the displayNone class is used on the drag icon so that it isn't displayed until this function is executed.
        don't use a 'show()' because in a pad, this icon is always hidden... for now.
        */
        $( ".draggable" ).removeClass('displayNone').draggable({
          addClasses: false,
          revert: 'invalid',
          zIndex: 999,
          containment: '#configuratorContainer',
          helper : 'clone',
          appendTo: '#configuratorContainer',
          start: function(event, ui) {
            dropped = false;
            ui.helper.find('.dragThumb').show();
            ui.helper.find('.dragIcon').hide();
            _gaq.push(['_trackEvent', 'Customizer', 'Drag', 'From Product List']);
          },
          stop: function(event, ui) {
            if (dropped === true) {$(this).remove();}
            else {$(this).removeClass("hide");}
          }
        });

        $( ".droppable" ).droppable({
          accept: '.draggable',
          hoverClass: 'tf_dropBox_hover',
          activeClass: 'dropItHere',
          drop: function(event, ui) {
            //    app.u.dump("DROP");
            //    app.u.dump(" -> ui.attr('data-pid') : "+ui.draggable.attr('data-pid'));
            //    app.u.dump(" -> new index : "+$(this).index());
            app.ext.mob_customizer.u.drawerAssignedToSpot($(this).index()+1,ui.draggable.attr('data-pid'));
            if(ui.draggable.attr('data-formerparentindex')) {
              app.ext.mob_customizer.u.drawerAssignedToSpot((ui.draggable.attr('data-formerparentindex') *1)+1);
            }
            $('#selectedDrawerContainer .dropItHere').removeClass('dropItHere');
          }
        });
      }
    } //util
  }; //r object.
  return r;
};