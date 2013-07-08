var app = app || {vars:{},u:{}}; //make sure app exists.
app.rq = app.rq || []; //ensure array is defined. rq = resource queue.



app.rq.push(['extension',0,'orderCreate','extensions/checkout/extension.js']);
app.rq.push(['extension',0,'cco','extensions/cart_checkout_order.js']);


app.rq.push(['extension',0,'store_prodlist','extensions/store_prodlist.js']);
app.rq.push(['extension',0,'store_navcats','extensions/store_navcats.js']);
app.rq.push(['extension',0,'store_search','extensions/store_search.js']);
app.rq.push(['extension',0,'store_product','extensions/store_product.js']);
app.rq.push(['extension',0,'store_cart','extensions/store_cart.js']);
app.rq.push(['extension',0,'store_crm','extensions/store_crm.js']);
app.rq.push(['extension',0,'mob_customizer','_mobapp_customizer.js']);
app.rq.push(['extension',0,'myRIA','app-quickstart.js','startMyProgram']);

app.rq.push(['extension',1,'google_analytics','extensions/partner_google_analytics.js','startExtension']);
//app.rq.push(['extension',1,'tools_ABtesting','extensions/tools_ABtesting.js']);
//app.rq.push(['extension',0,'partner_addthis','extensions/partner_addthis.js','startExtension']);
//app.rq.push(['extension',1,'resellerratings_survey','extensions/partner_buysafe_guarantee.js','startExtension']); /// !!! needs testing.
//app.rq.push(['extension',1,'buysafe_guarantee','extensions/partner_buysafe_guarantee.js','startExtension']);
//app.rq.push(['extension',1,'powerReviews_reviews','extensions/partner_powerreviews_reviews.js','startExtension']);
//app.rq.push(['extension',0,'magicToolBox_mzp','extensions/partner_magictoolbox_mzp.js','startExtension']); // (not working yet - ticket in to MTB)

app.rq.push(['script',0,(document.location.protocol == 'file:') ? app.vars.testURL+'jquery/config.js' : app.vars.baseURL+'jquery/config.js']); //The config.js is dynamically generated.
app.rq.push(['script',0,app.vars.baseURL+'model.js']); //'validator':function(){return (typeof zoovyModel == 'function') ? true : false;}}
app.rq.push(['script',0,app.vars.baseURL+'includes.js']); //','validator':function(){return (typeof handlePogs == 'function') ? true : false;}})

app.rq.push(['script',0,app.vars.baseURL+'controller.js']);

app.rq.push(['script',0,app.vars.baseURL+'resources/jquery.showloading-v1.0.jt.js']); //used pretty early in process..
app.rq.push(['script',0,app.vars.baseURL+'resources/jquery.ui.anyplugins.js']); //in zero pass in case product page is first page.




//add tabs to product data.
//tabs are handled this way because jquery UI tabs REALLY wants an id and this ensures unique id's between product
app.rq.push(['templateFunction','productTemplate','onCompletes',function(P) {
	var $context = $(app.u.jqSelector('#',P.parentID));
	var $tabContainer = $( ".tabbedProductContent",$context);
		if($tabContainer.length)	{
			if($tabContainer.data("widget") == 'anytabs'){} //tabs have already been instantiated. no need to be redundant.
			else	{
				$tabContainer.anytabs();
				}
			}
		else	{} //couldn't find the tab to tabificate.
	}]);

//sample of an onDeparts. executed any time a user leaves this page/template type.
// app.rq.push(['templateFunction','homepageTemplate','onDeparts',function(P) {app.u.dump("just left the homepage")}]);

///// custom \\\\\

/// hompage \\\
// app.rq.push(['templateFunction','homepageTemplate','onCompletes', function(P) {
//   // $('#headerCategories').hide();
//   // $('#headerBanner').show();
// }]);

// app.rq.push(['templateFunction','homepageTemplate','onDeparts', function(P) {
//   // $('#headerBanner').hide();
// }]);

// app.rq.push(['templateFunction','companyTemplate','onCompletes', function(P) {
//   // $('#headerCategories').show();
// }]);


// app.rq.push(['templateFunction','companyTemplate','onCompletes', function(P) {
//   // $('#headerCategories').show();
// }]);

// app.rq.push(['templateFunction','customerTemplate','onCompletes', function(P) {
//   // $('#headerCategories').show();
// }]);

/// categories \\\
var $catPageTopContent;

function getCategory (navcat, subLevel) {
  function getPeriodCount(value) {
    if (value) {
      return value.split('.').length - 1;
    }else {
      return 0;
    }
  }

  var periodCount = getPeriodCount(navcat);
  var level = (subLevel || 0) + 1; // default is category
  var value;

  if (periodCount > 0) {
    value = navcat.split('.')[level];
    if (value) {
      return '.' + value;
    }
  }
  return '';
}

app.rq.push(['templateFunction','categoryTemplate','onCompletes', function(P) {
  // $('#headerCategories').show();

  //handle conditional display of category page content.
  // $('.catPageTopContent').show();
  if(app.data['appPageGet|'+P.navcat] && typeof app.data['appPageGet|'+P.navcat]['%page'] == 'object' && typeof app.data['appPageGet|'+P.navcat]['%page']['picture1'] == 'string')  {
    $('#'+P.parentID+' '+'.catPageTopContent').show();
  }

  /*
  handles loading the customizer if the apprpriate cateory page is in focus
  executed onComplete because in onInit the cat page content still loads below it.
   -> not ideal, but will do for now till some sort of category template handler is in place (for choosing template)
  */
  if(P.navcat == '.customizer') {
    // app.u.dump([P]);
    $('#mastHead .promotionFree').hide();
    $('#mastHead .promotion15Off').show();

    $('#mainContentArea').empty(); //removes templateInstance for cat page which may already be present.
    app.model.abortQ('mutable'); //will kill existing process to stop default cat layout info from loading.
    app.ext.mob_customizer.actions.initConfigurator(P);
  }
  if (/\.ncaa-.+/.test(getCategory(P.navcat, 1))) {
    // app.u.dump('on ncaa');
    $('#' + P.parentID + ' ' + '.categoryImage').html("<img src='images/banner_college.jpg' alt='Category Image' />").show();
  }
  

}]);

app.rq.push(['templateFunction','categoryTemplate','onDeparts', function(P) {
  // $('#headerCategories').hide();
  if(P.navcat == '.customizer') {
    // app.u.dump([P]);
    $('#mastHead .promotion15Off').hide();
    $('#mastHead .promotionFree').show();

    // fix for customizer items not showing if you leave customizer and return
    app.ext.mob_customizer.vars.currentCategory = '';
    app.ext.mob_customizer.vars.currentDrawer = '';
  }
}]);

/// checkout \\\
app.rq.push(['templateFunction','checkoutTemplate','onCompletes', function(P) {
  $('#mainContentArea').append("<div class='alignRight'><a target='_blank' onclick=\"window.open('//verify.authorize.net/anetseal/?pid=0a37c5cf-0c5a-4f61-85e3-997f846fb316&rurl=http%3A//www.myownersbox.com/','AuthorizeNetVerification','width=600,height=430,dependent=yes,resizable=yes,scrollbars=yes,menubar=no,toolbar=no,status=no,directories=no,location=yes'); return false;\" onmouseout=\"window.status=''; return true;\" onmouseover=\"window.status='http://www.authorize.net/'; return true;\" href='//verify.authorize.net/anetseal/?pid=0a37c5cf-0c5a-4f61-85e3-997f846fb316&rurl=http%3A//www.myownersbox.com/'><img width='90' height='72' border='0' alt='Authorize.Net Merchant - Click to Verify' src='//verify.authorize.net/anetseal/images/secure90x72.gif'></a></div>");
}]);

app.rq.push(['templateFunction','checkoutTemplate','onDeparts', function(P) {
}]);


///// end custom \\\\\


//group any third party files together (regardless of pass) to make troubleshooting easier.
app.rq.push(['script',0,(document.location.protocol == 'https:' ? 'https:' : 'http:')+'//ajax.googleapis.com/ajax/libs/jqueryui/1.10.3/jquery-ui.min.js']);


/*
This function is overwritten once the controller is instantiated. 
Having a placeholder allows us to always reference the same messaging function, but not impede load time with a bulky error function.
*/
app.u.throwMessage = function(m)	{
	alert(m); 
	}

app.u.howManyPassZeroResourcesAreLoaded = function(debug)	{
	var L = app.vars.rq.length;
	var r = 0; //what is returned. total # of scripts that have finished loading.
	for(var i = 0; i < L; i++)	{
		if(app.vars.rq[i][app.vars.rq[i].length - 1] === true)	{
			r++;
			}
		if(debug)	{app.u.dump(" -> "+i+": "+app.vars.rq[i][2]+": "+app.vars.rq[i][app.vars.rq[i].length -1]);}
		}
	return r;
	}


//gets executed once controller.js is loaded.
//check dependencies and make sure all other .js files are done, then init controller.
//function will get re-executed if not all the scripts in app.vars.scripts pass 1 are done loading.
//the 'attempts' var is incremented each time the function is executed.

app.u.initMVC = function(attempts){
//	app.u.dump("app.u.initMVC activated ["+attempts+"]");
	var includesAreDone = true,
	percentPerInclude = (100 / app.vars.rq.length),   //what percentage of completion a single include represents (if 10 includes, each is 10%).
	resourcesLoaded = app.u.howManyPassZeroResourcesAreLoaded(),
	percentComplete = Math.round(resourcesLoaded * percentPerInclude); //used to sum how many includes have successfully loaded.

//make sure precentage is never over 100
	if(percentComplete > 100 )	{
		percentComplete = 100;
		}

	$('#appPreViewProgressBar','#appPreView').val(percentComplete);
	$('#appPreViewProgressText','#appPreView').empty().append(percentComplete+"% Complete");

	if(resourcesLoaded == app.vars.rq.length)	{
		var clickToLoad = false;
		if(clickToLoad){
			$('#loader').fadeOut(1000);
			$('#clickToLoad').delay(1000).fadeIn(1000).click(function() {
				app.u.loadApp();
			});
		} else {
			app.u.loadApp();
			}
		}
	else if(attempts > 50)	{
		app.u.dump("WARNING! something went wrong in init.js");
		//this is 10 seconds of trying. something isn't going well.
		$('#appPreView').empty().append("<h2>Uh Oh. Something seems to have gone wrong. </h2><p>Several attempts were made to load the store but some necessary files were not found or could not load. We apologize for the inconvenience. Please try 'refresh' and see if that helps.<br><b>If the error persists, please contact the site administrator</b><br> - dev: see console.</p>");
		app.u.howManyPassZeroResourcesAreLoaded(true);
		}
	else	{
		setTimeout("app.u.initMVC("+(attempts+1)+")",250);
		}

	}

app.u.loadApp = function() {
//instantiate controller. handles all logic and communication between model and view.
//passing in app will extend app so all previously declared functions will exist in addition to all the built in functions.
//tmp is a throw away variable. app is what should be used as is referenced within the mvc.
	app.vars.rq = null; //to get here, all these resources have been loaded. nuke record to keep DOM clean and avoid any duplication.
	var tmp = new zController(app);
//instantiate wiki parser.
	myCreole = new Parse.Simple.Creole();
	}


//Any code that needs to be executed after the app init has occured can go here.
//will pass in the page info object. (pageType, templateID, pid/navcat/show and more)
app.u.appInitComplete = function(P)	{
	app.u.dump("Executing myAppIsLoaded code...");
	}




//don't execute script till both jquery AND the dom are ready.
$(document).ready(function(){
	app.u.handleRQ(0)
	});






