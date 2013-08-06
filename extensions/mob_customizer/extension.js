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
		//The parameters of the customizer.  The below are defaults used by the
		//customizer should none be found from the infoObj passed or localstorage
		params : {
			s1 : ".storage-containers.major-league-baseball", //The navcat chosen for Step 1- which populates step 2's product list
			s2 : "50092MLB", //The product chosen for Step 2- which determines the number of drawers allowed in step 3
			s3 : ".drawers.major-league-baseball", //The currently expanded navcat for Step 3
			drawers : [] //Drawers chosen by the user.
			},
		//The navcats used by the customizer to load information and display in the app.
		paths : {
			customizer : ".customizer", //The category page to attach the customizer to
			s1 : ".storage-containers", //The parent navcat of the category choices in step 1
			s3 : ".drawers", //The parent navcat of the category choices in step 3
			templateHTML : "extensions/mob_customizer/templates.html" // The file path for the HTML file the templates live in.
			},
		//An array of the names of the templates contained in the templateHTML file above
		templates : [
			'categoryTemplateMOBCustomizer',
			's1Template',
			's2Template',
			's3Template',
			'productTemplateDrawerPreview',
			'productTemplateDrawerList',
			'productTemplateStorageList',
			'productTemplateStorageChoice'
			],
		willFetchMyOwnTemplates : true,
		//A prefix to help keep our localstorage object clean and collision free
		localStorageDatapointerPrefix : 'MOBCustomizer|',
		//The minimum number of drawers that are allowed to be purchased
		minimumDrawers : 2
		},

////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

	callbacks : {
		init : {
			onSuccess : function()	{
				var r = false; 
				app.ext.mob_customizer.vars.defaultParams = $.extend(true, {}, app.ext.mob_customizer.vars.params);
				app.model.fetchNLoadTemplates(app.vars.baseURL + app.ext.mob_customizer.vars.paths.templateHTML, app.ext.mob_customizer.vars.templates);
				app.rq.push(['myRIA', 'pageHandler', 'category', app.ext.mob_customizer.vars.paths.customizer, 'categoryTemplateMOBCustomizer', 'mob_customizer', 1]);
				app.rq.push(['templateFunction', 'categoryTemplateMOBCustomizer', 'onCompletes', function(P){
					app.ext.mob_customizer.u.initCustomizer(P);
					}]);
				
				r = true;
				
				return r;
				},
			onError : function()	{
				app.u.dump('BEGIN mob_customizer.callbacks.init.onError');
				}
			},
		populateS1 : {
			onSuccess : function(tagObj){
				app.u.dump("-> mob_customizer.callbacks.populateS1.onSuccess");
				app.ext.mob_customizer.a.setS1(app.ext.mob_customizer.vars.params.s1);
				var $s1 = $('[data-mobcustomizer=s1]', app.ext.mob_customizer.vars.$context);
				$s1.empty().anycontent({"datapointer":tagObj.datapointer,"templateID":$s1.attr('data-templateID')});
				
				},
			onError : function(responseData,uuid){app.u.throwMessage(responseData);}
			},
		setS1 : {
			onSuccess : function(tagObj){
				app.u.dump("-> mob_customizer.callbacks.setS1.onSuccess");
				$('[data-mobcustomizer=s1]', app.ext.mob_customizer.vars.$context).hideLoading();
				$('[data-mobcustomizer=s2]', app.ext.mob_customizer.vars.$context).hideLoading();
				var $s2 = $('[data-mobcustomizer=s2]', app.ext.mob_customizer.vars.$context);
				$s2.empty().anycontent({"datapointer":tagObj.datapointer,"templateID":$s2.attr('data-templateID')});
				},
			onError : function(responseData,uuid){
				app.u.dump("-> mob_customizer.callbacks.setS1.onError");
				app.u.throwMessage(responseData);
				app.ext.mob_customizer.a.setS1(app.ext.mob_customizer.vars.defaultParams.s1);
				}
			},
		populateS2 : {
			onSuccess : function(tagObj){
				app.u.dump("-> mob_customizer.callbacks.populateS2.onSuccess");
				},
			onError : function(responseData,uuid){app.u.throwMessage(responseData);}
			},
		setS2 : {
			onSuccess : function(tagObj){
				app.u.dump("-> mob_customizer.callbacks.setS2.onSuccess");
				$('[data-mobcustomizer=s2]', app.ext.mob_customizer.vars.$context).hideLoading();
				$('[data-mobcustomizer="previewContainer"]', app.ext.mob_customizer.vars.$context).hideLoading();
				$('[data-mobcustomizer="prodList"]', app.ext.mob_customizer.vars.$context).hideLoading();
				$('[data-mobcustomizer="storageChoice"]', app.ext.mob_customizer.vars.$context).hideLoading();
				
				var prod = app.data[tagObj.datapointer];
				var dimensions = prod['%attribs']['zoovy:prod_dimensions'].toLowerCase();
				
				var $storageChoice = $('[data-mobcustomizer="storageChoice"]', app.ext.mob_customizer.vars.$context)
				$storageChoice.intervaledEmpty().anycontent({"datapointer":tagObj.datapointer,"templateID":$storageChoice.attr('data-templateID')});
				
				//Truncates drawers if our new storage container is smaller
				var tmpDrawers = app.ext.mob_customizer.vars.params.drawers.slice(0);
				app.ext.mob_customizer.vars.params.drawers = [];
				
				var $prodList = $('[data-mobcustomizer="prodList"]', app.ext.mob_customizer.vars.$context);
				$prodList.intervaledEmpty();
				var $previewList = $('[data-mobcustomizer="previewList"]', app.ext.mob_customizer.vars.$context);
				$previewList.intervaledEmpty();
				for(var i=1; i <= app.ext.mob_customizer.u.getSpotCountFromDimensions(dimensions); i++){
					var $previewSlot = $("<div data-index='"+i+"' data-templateID='"+$previewList.attr('data-loadsTemplate')+"'></div>")
					$previewSlot.droppable({
						accept:".MOBdraggable",
						drop: function(event, ui){
							app.ext.mob_customizer.a.chooseDrawer($(this).attr('data-index'), ui.draggable.data('pid'));
							}
						});
					$previewList.append($previewSlot);
					
					var $prodSlot = $("<div data-index='"+i+"' data-templateID='"+$prodList.attr('data-loadsTemplate')+"'></div>");
					$prodList.append($prodSlot);
					if(tmpDrawers[i]){
						app.ext.mob_customizer.a.chooseDrawer(i,tmpDrawers[i], true);
						}
					else{
						app.ext.mob_customizer.a.chooseDrawer(i);
						}
					}
				app.model.dispatchThis('immutable');
				
				
				
				},
			onError : function(responseData,uuid){
				app.u.dump("-> mob_customizer.callbacks.setS2.onError");
				app.u.throwMessage(responseData); 
				app.ext.mob_customizer.a.setS2(app.ext.mob_customizer.vars.defaultParams.s2);
				}
			},
		populateS3 : {
			onSuccess : function(tagObj){
				app.u.dump("-> mob_customizer.callbacks.populateS3.onSuccess");
				var $s3 = $('[data-mobcustomizer=s3]', app.ext.mob_customizer.vars.$context);
				$s3.hideLoading();
				$s3.empty().anycontent({"datapointer":tagObj.datapointer,"templateID":$s3.attr('data-templateID')});
				app.ext.mob_customizer.a.setS3(app.ext.mob_customizer.vars.params.s3);
				},
			onError : function(responseData,uuid){app.u.throwMessage(responseData);}
			},
		setS3 : {
			onSuccess : function(tagObj, attempts){
				app.u.dump("-> mob_customizer.callbacks.setS3.onSuccess");
				var $drawerList = $('[data-mobcustomizer="s3DrawerList"][data-navcat="'+tagObj.navcat+'"]', app.ext.mob_customizer.vars.$context);
				attempts = attempts || 0;
				if($drawerList.length > 0){
					$('[data-mobcustomizer="s3"]', app.ext.mob_customizer.vars.$context).hideLoading();
					$drawerList.anycontent({"datapointer":tagObj.datapointer, "templateID":$drawerList.attr('data-templateID')});
					}
				else if(attempts < 50){
					setTimeout(function(){
						app.ext.mob_customizer.callbacks.setS3.onSuccess(tagObj, attempts+1);
						}, 250);
					}
				else {
					app.ext.mob_customizer.callbacks.setS3.onError("Something went wrong while choosing your drawer category!");
					}
				},
			onError : function(responseData,uuid){
				app.u.dump("-> mob_customizer.callbacks.setS3.onError");
				app.u.throwMessage(responseData); 
				app.ext.mob_customizer.a.setS3(app.ext.mob_customizer.vars.defaultParams.s3);
				}
			},
		chooseDrawer : {
			onSuccess : function(tagObj){
				app.u.dump("-> mob_customizer.callbacks.chooseDrawer.onSuccess");
				$('[data-mobcustomizer="previewContainer"]', app.ext.mob_customizer.vars.$context).hideLoading();
				var $previewItem = $('[data-mobcustomizer="previewList"] [data-index="'+tagObj.index+'"]', app.ext.mob_customizer.vars.$context);
				var $prodItem = $('[data-mobcustomizer="prodList"] [data-index="'+tagObj.index+'"]', app.ext.mob_customizer.vars.$context);
				//app.u.dump($previewItem);
				app.u.dump(tagObj);
				if(tagObj.empty){
					//Blanking out the drawer
					$previewItem.intervaledEmpty().anycontent({"data":{},"templateID":$previewItem.attr('data-templateID')});
					$prodItem.intervaledEmpty().anycontent({"data":{}, "templateID":$prodItem.attr('data-templateID')});
					}
				else {
					$previewItem.intervaledEmpty().anycontent({"datapointer":tagObj.datapointer,"templateID":$previewItem.attr('data-templateID')});
					$prodItem.intervaledEmpty().anycontent({"datapointer":tagObj.datapointer,"templateID":$previewItem.attr('data-templateID')});
					}
				},
			onError : function(responseData,uuid){
				app.u.dump("-> mob_customizer.callbacks.chooseDrawer.onError");
				app.u.throwMessage(responseData);
				app.ext.mob_customizer.a.chooseDrawer(responseData.index);
				}
			},
		}, //callbacks



////////////////////////////////////   ACTION [a]    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		a : {
			setS1 : function(navcat, noDispatch){
				$('[data-mobcustomizer=s1]', app.ext.mob_customizer.vars.$context).showLoading();
				app.ext.mob_customizer.vars.params.s1 = navcat;
				//Fetch data for this navcat- the callback will handle pushing the products to step 2
				if(	app.ext.store_navcats.calls.appCategoryDetailMax.init(navcat, {"callback":"setS1","extension":"mob_customizer"}, 'immutable') &&
					!noDispatch){
					app.model.dispatchThis('immutable');
					}
				app.ext.mob_customizer.u.updateLocalStorage();
				},
			setS2 : function(pid, noDispatch){
				$('[data-mobcustomizer=s2]', app.ext.mob_customizer.vars.$context).showLoading();
				$('[data-mobcustomizer="previewContainer"]', app.ext.mob_customizer.vars.$context).showLoading();
				$('[data-mobcustomizer="prodList"]', app.ext.mob_customizer.vars.$context).showLoading();
				$('[data-mobcustomizer="storageChoice"]', app.ext.mob_customizer.vars.$context).showLoading();
				app.ext.mob_customizer.vars.params.s2 = pid;
				//Fetch data for this product- 
				//the callback will handle: 
				//	-setting the size of the customizer view
				//	-re-initializing the drawer array (clip extras)
				if(	app.ext.store_product.calls.appProductGet.init(pid,{"callback":"setS2","extension":"mob_customizer"}, 'immutable') &&
					!noDispatch){
					app.model.dispatchThis('immutable');
					}
				app.ext.mob_customizer.u.updateLocalStorage();
				},
			setS3 : function(navcat, noDispatch){
				$('[data-mobcustomizer=s3]', app.ext.mob_customizer.vars.$context).showLoading();
				$('[data-mobcustomizer=s3DrawerList]',app.ext.mob_customizer.vars.$context).intervaledEmpty();
				app.ext.mob_customizer.vars.params.s3 = navcat;
				//Fetch data for this navcat- the callback will handle displaying the product list
				if(	app.ext.store_navcats.calls.appCategoryDetailMax.init(navcat, {"callback":"setS3","extension":"mob_customizer", "navcat":navcat}, 'immutable') &&
					!noDispatch){
					app.model.dispatchThis('immutable');
					}
				app.ext.mob_customizer.u.updateLocalStorage();
				},
			chooseDrawer : function(index, pid, noDispatch){
				if(pid && pid != ""){
					app.ext.mob_customizer.vars.params.drawers[index] = pid;
					$('[data-mobcustomizer="previewContainer"]', app.ext.mob_customizer.vars.$context).showLoading();
					if(	app.ext.store_product.calls.appProductGet.init(pid,{"callback":"chooseDrawer","extension":"mob_customizer","index":index}, 'immutable') &&
						!noDispatch){
						app.model.dispatchThis('immutable');
						}
				} else {
					delete app.ext.mob_customizer.vars.params.drawers[index];
					app.ext.mob_customizer.callbacks.chooseDrawer.onSuccess({"index":index,"empty":true});
					}
				app.ext.mob_customizer.u.updateLocalStorage();
				},
				
			addToCart : function(){
				var drawerToQtyMap = {};
				var numDrawers = 0;
				for(var index in app.ext.mob_customizer.vars.params.drawers){
					var pid = app.ext.mob_customizer.vars.params.drawers[index];
					if(pid != ""){
						if(drawerToQtyMap[pid]){
							drawerToQtyMap[pid] += 1;
							}
						else {
							drawerToQtyMap[pid] = 1;
							}
						numDrawers++;
						}
					}
				
				if(numDrawers < app.ext.mob_customizer.vars.minimumDrawers){
					app.u.throwMessage("Sorry, you must select at least "+app.ext.mob_customizer.vars.minimumDrawers+" drawers.");
					}
				else {
					app.calls.cartItemAppend.init({"sku":app.ext.mob_customizer.vars.params.s2,"qty":1});
					for(var pid in drawerToQtyMap){
						app.calls.cartItemAppend.init({"sku":pid,"qty":drawerToQtyMap[pid]});
						}
					app.calls.refreshCart.init({'callback':function(){app.ext.myRIA.u.showCart();}},'immutable');
					app.model.dispatchThis('immutable');
					
					}
				},
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
			s1Select : function($tag, data){
				for(var index in data.value){
					var $option = $('<option value="'+data.value[index].id+'">'+data.value[index].pretty+'</option>');
					$option.on('click.selectS1', function(){
						app.ext.mob_customizer.a.setS1($(this).val());
						});
					$tag.append($option);
					}
				},
			s2Link : function($tag, data){
				$tag.data('pid', data.value);
				$tag.off('click.mobcustomizer_setS2').on('click.mobcustomizer_setS2',function(){
					app.ext.mob_customizer.a.setS2($(this).data('pid'));
					});
				},
			s3Link : function($tag, data){
				$tag.data('navcat', data.value);
				$tag.off('click.mobcustomizer_setS3').on('click.mobcustomizer_setS3',function(){
					app.ext.mob_customizer.a.setS3($(this).data('navcat'));
					});
				},
			draggableDrawer : function($tag, data){
				$tag.data('pid', data.value);
				$tag.addClass("MOBdraggable").draggable({
					helper:"clone",
					revert:"invalid"
					});
				},
			droppableSlot : function($tag, data){
				
				},
			view360inModal : function($tag,data)  {
				$tag.removeClass('displayNone').addClass('pointer');
				$tag.click(function(){
					app.ext.mob_customizer.actions.show360Viewer(data.value);
					});
				} //view360inModal

			}, //renderFormats

////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		u : {
			initCustomizer : function(infoObj){
				//Set a jquery context for us to perform selections inside while the customizer is loaded
				app.ext.mob_customizer.vars.$context = $(app.u.jqSelector('#',infoObj.parentID));
				
				
				//Set the initial choices in the app
				var localParams = this.retrieveLocalStorage();
				app.u.dump("URI PARAMS:");
				app.u.dump(infoObj.uriParams);
				app.u.dump("LOCAL PARAMS:");
				app.u.dump(localParams);
				//Chooses infoObj (which includes any URL information passed from myRIA) first,
				if(infoObj.uriParams.s1 && infoObj.uriParams.s2 && infoObj.uriParams.s3){
					var drawers = [];
					for(var index in infoObj.uriParams){
						//looks for "d1" through "d9"
						//If products allow for more than 9 drawers this may need to be changed later on
						//note: array as string implementation?  "?s1=foo&s2=bar&s3=baz&drawers=[pid1,pid2,pid3,,pid5,]"
						//concerns: URI encoding of quotes, brackets, commas?
						if((/d[123456789]/).exec(index) == index){
							drawers[Number(index.charAt(1))] = infoObj.uriParams[index];
							}
						}
					app.ext.mob_customizer.vars.params = {
						s1 : infoObj.uriParams.s1,
						s2 : infoObj.uriParams.s2,
						s3 : infoObj.uriParams.s3,
						drawers : drawers
						}
					
					}
				//Then falls back to the localStorage, and if nothing is there,
				else if(localParams.s1 && localParams.s2 && localParams.s3){
					app.ext.mob_customizer.vars.params = localParams;
					}
				//falls back to the defaults specified in vars
				else {
					//Don't overwrite defaults
					}
				
				//Start the fireworks
				$('[data-mobcustomizer=s1]', app.ext.mob_customizer.vars.$context).showLoading();
				$('[data-mobcustomizer=s2]', app.ext.mob_customizer.vars.$context).showLoading();
				$('[data-mobcustomizer=s3]', app.ext.mob_customizer.vars.$context).showLoading();
				app.ext.store_navcats.calls.appCategoryDetailMax.init(
					app.ext.mob_customizer.vars.paths.s1,
					{"callback":"populateS1","extension":"mob_customizer"},
					'immutable');
				//app.ext.mob_customizer.a.setS1(app.ext.mob_customizer.vars.params.s1, true);
				app.ext.mob_customizer.a.setS2(app.ext.mob_customizer.vars.params.s2, true);
				app.ext.store_navcats.calls.appCategoryDetailMax.init(
					app.ext.mob_customizer.vars.paths.s3,
					{"callback":"populateS3","extension":"mob_customizer","showNavcat":app.ext.mob_customizer.vars.params.s3},
					'immutable');
				//app.ext.mob_customizer.a.setS3(app.ext.mob_customizer.vars.params.s3, true);
				for(var index in app.ext.mob_customizer.vars.drawers){
					app.ext.mob_customizer.a.chooseDrawer(index, app.ext.mob_customizer.vars.drawers[index], true);
					}
				app.model.dispatchThis('immutable');
				},
			updateLocalStorage : function(){
				app.storageFunctions.writeLocal(app.ext.mob_customizer.vars.localStorageDatapointerPrefix+'params', app.ext.mob_customizer.vars.params);
				},
			retrieveLocalStorage : function(){
				return app.storageFunctions.readLocal(app.ext.mob_customizer.vars.localStorageDatapointerPrefix+'params');
				},
			clearLocalStorage : function(){
				localStorage.removeItem(app.ext.mob_customizer.vars.localStorageDatapointerPrefix+'params');
				},
			getSpotCountFromDimensions : function(dim)  {
				var r;
				var ints = dim.split('x');
				r = Number(ints[0])*Number(ints[1]);
				return r;
				}
			}, //u [utilities]

////////////////////////////////////  APP EVENTS [e]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		e : {
			} //e [app Events]
		} //r object.
	return r;
	}