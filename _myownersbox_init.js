var app = app || {vars:{},u:{}}; //make sure app exists.
app.rq = app.rq || []; //ensure array is defined. rq = resource queue.

// TODO: add side images to drawers - solid color


// app.rq.push(['extension',0,'convertSessionToOrder','extensions/checkout_passive/extension.js']);
app.rq.push(['extension',0,'mob_customizer','_mobapp_customizer.js']);
app.rq.push(['extension',0,'convertSessionToOrder','extensions/checkout_nice/extension.js']);
app.rq.push(['extension',0,'store_checkout','extensions/store_checkout.js']);
app.rq.push(['extension',0,'store_prodlist','extensions/store_prodlist.js']);
app.rq.push(['extension',0,'store_navcats','extensions/store_navcats.js']);
app.rq.push(['extension',0,'store_search','extensions/store_search.js']);
app.rq.push(['extension',0,'store_product','extensions/store_product.js']);
app.rq.push(['extension',0,'store_cart','extensions/store_cart.js']);
app.rq.push(['extension',0,'store_crm','extensions/store_crm.js']);
app.rq.push(['extension',0,'myRIA','quickstart.js','startMyProgram']);

app.rq.push(['extension',1,'analytics_google','extensions/analytics_google.js','addTriggers']);
//app.rq.push(['extension',1,'bonding_buysafe','extensions/bonding_buysafe.js','addTriggers']);
//app.rq.push(['extension',1,'powerReviews','extensions/reviews_powerreviews.js','startExtension']);
//app.rq.push(['extension',0,'magicToolBox','extensions/imaging_magictoolbox.js','startExtension']); // (not working yet - ticket in to MTB)



//add tabs to product data.
app.rq.push(['templateFunction','productTemplate','onCompletes',function(P) {
  $( ".tabbedProductContent",$('#productTemplate_'+app.u.makeSafeHTMLId(P.pid))).tabs();
  }]);

app.rq.push(['script',0,(document.location.protocol == 'file:') ? app.vars.httpURL+'jquery/config.js' : app.vars.baseURL+'jquery/config.js']); //The config.js is dynamically generated.
app.rq.push(['script',0,app.vars.baseURL+'model.js']); //'validator':function(){return (typeof zoovyModel == 'function') ? true : false;}}
app.rq.push(['script',0,app.vars.baseURL+'includes.js']); //','validator':function(){return (typeof handlePogs == 'function') ? true : false;}})
app.rq.push(['script',1,app.vars.baseURL+'jeditable.js']); //used for making text editable (customer address). non-essential. loaded late.
app.rq.push(['script',0,app.vars.baseURL+'controller.js']);

//sample of an onDeparts. executed any time a user leaves this page/template type.
// app.rq.push(['templateFunction','homepageTemplate','onDeparts',function(P) {app.u.dump("just left the homepage")}]);

///// custom \\\\\

/// hompage \\\
app.rq.push(['templateFunction','homepageTemplate','onCompletes', function(P) {
  $('#headerBanner').show();
}]);

app.rq.push(['templateFunction','homepageTemplate','onDeparts', function(P) {
  $('#headerBanner').hide();
}]);

/// categories \\\
app.rq.push(['templateFunction','categoryTemplate','onCompletes', function(P) {
  $('#headerCategories').show();

  /*
  handles loading the customizer if the apprpriate cateory page is in focus
  executed onComplete because in onInit the cat page content still loads below it.
   -> not ideal, but will do for now till some sort of category template handler is in place (for choosing template)
  */
  if(P.navcat == '.customizer') {
    app.u.dump([P]);

    $('#mainContentArea').empty(); //removes templateInstance for cat page which may already be present.
    app.model.abortQ('mutable'); //will kill existing process to stop default cat layout info from loading.
    app.ext.mob_customizer.actions.initConfigurator(P);
  }
  
  //handle conditional display of category page content.
  $('.catPageTopContent').show();
  // if(app.data['appPageGet|'+P.navcat] && typeof app.data['appPageGet|'+P.navcat]['%page'] == 'object' && typeof app.data['appPageGet|'+P.navcat]['%page']['picture1'])  {
    // $('#catPageTopContent').show();
  // }
}]);

app.rq.push(['templateFunction','categoryTemplate','onDeparts', function(P) {
  $('#headerCategories').hide();
}]);

/// checkout \\\
app.rq.push(['templateFunction','checkoutTemplate','onCompletes', function(P) {
  $('#mainContentArea').append("<div class='alignRight'><a target='_blank' onclick=\"window.open('//verify.authorize.net/anetseal/?pid=0a37c5cf-0c5a-4f61-85e3-997f846fb316&rurl=http%3A//www.myownersbox.com/','AuthorizeNetVerification','width=600,height=430,dependent=yes,resizable=yes,scrollbars=yes,menubar=no,toolbar=no,status=no,directories=no,location=yes'); return false;\" onmouseout=\"window.status=''; return true;\" onmouseover=\"window.status='http://www.authorize.net/'; return true;\" href='//verify.authorize.net/anetseal/?pid=0a37c5cf-0c5a-4f61-85e3-997f846fb316&rurl=http%3A//www.myownersbox.com/'><img width='90' height='72' border='0' alt='Authorize.Net Merchant - Click to Verify' src='//verify.authorize.net/anetseal/images/secure90x72.gif'></a></div>");
}]);

app.rq.push(['templateFunction','checkoutTemplate','onDeparts', function(P) {
}]);


///// end custom \\\\\

//group any third party files together (regardless of pass) to make troubleshooting easier.
app.rq.push(['script',0,(document.location.protocol == 'https:' ? 'https:' : 'http:')+'//ajax.googleapis.com/ajax/libs/jqueryui/1.9.0/jquery-ui.js']);


/*
This function is overwritten once the controller is instantiated.
Having a placeholder allows us to always reference the same messaging function, but not impede load time with a bulky error function.
*/
app.u.throwMessage = function(m)  {
  alert(m); 
  }

app.u.howManyPassZeroResourcesAreLoaded = function(debug) {
  var L = app.vars.rq.length;
  var r = 0; //what is returned. total # of scripts that have finished loading.
  for(var i = 0; i < L; i++)  {
    if(app.vars.rq[i][app.vars.rq[i].length - 1] === true)  {
      r++;
      }
    if(debug) {app.u.dump(" -> "+i+": "+app.vars.rq[i][2]+": "+app.vars.rq[i][app.vars.rq[i].length -1]);}
    }
  return r;
  }


//gets executed once controller.js is loaded.
//check dependencies and make sure all other .js files are done, then init controller.
//function will get re-executed if not all the scripts in app.vars.scripts pass 1 are done loading.
//the 'attempts' var is incremented each time the function is executed.

app.u.initMVC = function(attempts){
//  app.u.dump("app.u.initMVC activated ["+attempts+"]");
  var includesAreDone = true;

//what percentage of completion a single include represents (if 10 includes, each is 10%).
  var percentPerInclude = Math.round((100 / app.vars.rq.length));  
  var resourcesLoaded = app.u.howManyPassZeroResourcesAreLoaded();
  var percentComplete = resourcesLoaded * percentPerInclude; //used to sum how many includes have successfully loaded.

  $('#appPreViewProgressBar').val(percentComplete);
  $('#appPreViewProgressText').empty().append(percentComplete+"% Complete");

  if(resourcesLoaded == app.vars.rq.length) {
//instantiate controller. handles all logic and communication between model and view.
//passing in app will extend app so all previously declared functions will exist in addition to all the built in functions.
//tmp is a throw away variable. app is what should be used as is referenced within the mvc.
    app.vars.rq = null; //to get here, all these resources have been loaded. nuke record to keep DOM clean and avoid any duplication.
    var tmp = new zController(app);
//instantiate wiki parser.
    myCreole = new Parse.Simple.Creole();
    }
  else if(attempts > 50)  {
    app.u.dump("WARNING! something went wrong in init.js");
    //this is 10 seconds of trying. something isn't going well.
    $('#appPreView').empty().append("<h2>Uh Oh. Something seems to have gone wrong. </h2><p>Several attempts were made to load the store but some necessary files were not found or could not load. We apologize for the inconvenience. Please try 'refresh' and see if that helps.<br><b>If the error persists, please contact the site administrator</b><br> - dev: see console.</p>");
    app.u.howManyPassZeroResourcesAreLoaded(true);
    }
  else  {
    setTimeout("app.u.initMVC("+(attempts+1)+")",250);
    }

  }



//Any code that needs to be executed after the app init has occured can go here.
//will pass in the page info object. (pageType, templateID, pid/navcat/show and more)
app.u.appInitComplete = function(P) {
  // app.u.dump("Executing myAppIsLoaded code...");
}




//don't execute script till both jquery AND the dom are ready.
$(document).ready(function(){
  app.u.handleRQ(0);
});