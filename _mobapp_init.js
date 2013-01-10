var app = app || {vars:{},u:{}}; //make sure app exists.
app.rq = app.rq || []; //ensure array is defined. rq = resource queue.




//app.rq.push(['extension',0,'convertSessionToOrder','extensions/checkout_passive/extension.js']);
app.rq.push(['extension',0,'convertSessionToOrder','extensions/checkout_nice/extension.js']);
app.rq.push(['extension',0,'store_checkout','extensions/store_checkout.js']);
app.rq.push(['extension',0,'store_prodlist','extensions/store_prodlist.js']);
app.rq.push(['extension',0,'store_navcats','extensions/store_navcats.js']);
app.rq.push(['extension',0,'store_search','extensions/store_search.js']);
app.rq.push(['extension',0,'store_product','extensions/store_product.js']);
app.rq.push(['extension',0,'store_cart','extensions/store_cart.js']);
app.rq.push(['extension',0,'store_crm','extensions/store_crm.js']);
// app.rq.push(['extension',0,'mob_customizer','_mobapp_customizer.js']);
app.rq.push(['extension',0,'myRIA','quickstart.js','startMyProgram']);

app.rq.push(['extension',1,'analytics_google','extensions/analytics_google.js','startExtension']);
//app.rq.push(['extension',1,'bonding_buysafe','extensions/bonding_buysafe.js','startExtension']);
//app.rq.push(['extension',1,'powerReviews','extensions/reviews_powerreviews.js','startExtension']);
//app.rq.push(['extension',0,'magicToolBox','extensions/imaging_magictoolbox.js','startExtension']); // (not working yet - ticket in to MTB)


//spec_LLTRSHIRT017_0
//add tabs to product data.
//tabs are handled this way because jquery UI tabs REALLY wants an id and this ensures unique id's between product
app.rq.push(['templateFunction','productTemplate','onCompletes',function(P) {
  var safePID = app.u.makeSafeHTMLId(P.pid); //can't use jqSelector because productTEmplate_pid still used makesafe. planned Q1-2012 update ###
  var $tabContainer = $( ".tabbedProductContent",$('#productTemplate_'+safePID));
    if($tabContainer.length)  {
      if($tabContainer.data("tabs")){} //tabs have already been instantiated. no need to be redundant.
      else  {
        $("div.tabContent",$tabContainer).each(function (index) {
          $(this).attr("id", "spec_"+safePID+"_" + index.toString());
          })
        $(".tabs li a",$tabContainer).each(function (index) {
          $(this).attr('id','href_'+safePID+"_" + index.toString());
          $(this).attr("href", "app://#spec_"+safePID+"_" + index.toString());
          });
        $tabContainer.localtabs();
        }
      }
    else  {} //couldn't find the tab to tabificate.
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
  // $('#headerCategories').hide();
  // $('#headerBanner').show();
}]);

app.rq.push(['templateFunction','homepageTemplate','onDeparts', function(P) {
  // $('#headerBanner').hide();
}]);

app.rq.push(['templateFunction','companyTemplate','onCompletes', function(P) {
  // $('#headerCategories').show();
}]);


app.rq.push(['templateFunction','companyTemplate','onCompletes', function(P) {
  // $('#headerCategories').show();
}]);

app.rq.push(['templateFunction','customerTemplate','onCompletes', function(P) {
  // $('#headerCategories').show();
}]);

/// categories \\\
var $sidelineCompany;
var $catPageTopContent;
var $breadcrumb;
var $categoryExtra;

app.rq.push(['templateFunction','categoryTemplate','onCompletes', function(P) {
  // $('#headerCategories').show();

  //handle conditional display of category page content.
  // $('.catPageTopContent').show();
  app.u.dump('start');
  app.u.dump([app.data['appPageGet|'+P.navcat]]);
  app.u.dump(typeof app.data['appPageGet|'+P.navcat]['%page'] == 'object');
  app.u.dump(typeof app.data['appPageGet|'+P.navcat]['%page']['picture1']);
  app.u.dump('end');

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
  }else if (P.navcat == '.press-releases') {
    $sidelineCompany = $sidelineCompany || $('#'+P.parentID+' '+'.sidelineCompanyCategory');
    $breadcrumb      = $breadcrumb      || $('#'+P.parentID+' '+'#breadcrumb');
    $categoryExtra   = $categoryExtra   || $('#'+P.parentID+' '+'.categoryExtra');

    $sidelineCompany.show();
    $breadcrumb.hide();
    $categoryExtra.show();
    // $('#mainContentArea').append($('.sidelineCompany'));
  // $sidelineCompany = $sidelineCompany || $('#mainContentArea').append($('.sidelineCompany'));
  // $('.sidelineCompany').show();
  }
  

}]);

app.rq.push(['templateFunction','categoryTemplate','onDeparts', function(P) {
  // $('#headerCategories').hide();
  if(P.navcat == '.customizer') {
    // app.u.dump([P]);
    $('#mastHead .promotion15Off').hide();
    $('#mastHead .promotionFree').show();
  }
  if($sidelineCompany) {
    $sidelineCompany.hide();
  }
  if($breadcrumb) {
    $breadcrumb.hide();
  }
  if($categoryExtra) {
    $categoryExtra.hide();
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
  var percentPerInclude = (100 / app.vars.rq.length);
  var resourcesLoaded = app.u.howManyPassZeroResourcesAreLoaded();
  var percentComplete = Math.round(resourcesLoaded * percentPerInclude); //used to sum how many includes have successfully loaded.
  
  if(percentComplete > 100 )
    percentComplete = 100;
  
  $('#appPreViewProgressBar').val(percentComplete);
  $('#appPreViewProgressText').empty().append(percentComplete+"% Complete");

  if(resourcesLoaded == app.vars.rq.length) {
    percentComplete = 100;
    $('#appPreViewProgressBar').val(percentComplete);
    $('#appPreViewProgressText').empty().append(percentComplete+"% Complete");
    var clickToLoad = false;
    if(clickToLoad){
      $('#loader').fadeOut(1000);
      $('#tenFourGoodBuddy').delay(1000).fadeIn(1000).click(function() {
        app.u.loadApp();
      });
    } else {
      app.u.loadApp();
    }
    
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

};

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
app.u.appInitComplete = function(P) {
  // app.u.dump("Executing myAppIsLoaded code...");
}




//don't execute script till both jquery AND the dom are ready.
$(document).ready(function(){
  app.u.handleRQ(0)
  });






