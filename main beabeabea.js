/*

 main.js

  Copyright 2005-2010 David Arndt, released under the Clear BSD
  license.

  Karlsruhe Event Kalender.

  Beate Braun, Dorothea Heim, Michael Kuch, Jan Zwiener.

*/

/** GeoExt.data.FeatureStore für die Event Daten */
var g_store;
/** OpenLayers layer Objekt für die Event Punkte */
var g_vecLayer;
/** Wenn wir zum ersten mal die komplette Event Liste bekommen haben, dann ist
* der Kalender (links oben) bereit */
var g_eventCalendarReady = false;
/** Das Kalender Control */
var g_datePicker;

/** Load only events with a certain date in the store.
* @param storeObj {String} Store object.
* @param datestring {String} Date string. */
function updateStore(storeObj, datestring) {

    storeObj.proxy = new GeoExt.data.ProtocolProxy({
        protocol: new OpenLayers.Protocol.HTTP({
            url    : "php/db2json.php?date=" + datestring,
            format : new OpenLayers.Format.GeoJSON()
        })
    });
    storeObj.load();
}

/** Event listener für den GeoJSON FeatureStore.
 *  Diese Funktion wird immer aufgerufen, wenn neue Daten im
 *  FeatureStore bereit sind.
 *  Beim ersten Aufruf wird das Kalendar Control so angepasst,
 *  dass alle Termine im Kalender sichtbar sind.
 *  @param store {GeoExt.data.FeatureStore} Der Feature Store
 *  @param records {Ext.data.Record} Die Einträge
 *  @param options {Object} Optionen
 */
function onFeatureStoreData(store, records, options)
{
    if(records.length < 1)
        return;

    /*
     *console.log("Event new data:");
     *store.each(function(record){
     *    console.log("Date: " + record.data.date);
     *});
     */

    if(g_eventCalendarReady == false)
    {
        var enabledDates = new Array();
        store.each(function(record){
            enabledDates.push(record.data.date);
            //console.log("Date: " + record.data.date);
        });
        g_datePicker.setEnabledDates(enabledDates);

        g_eventCalendarReady = true;
    }

    g_vecLayer.removeAllFeatures();
    store.bind(g_vecLayer);
    g_vecLayer.redraw();
}

/** Erzeugt ein Fenster um ein neues Ereignis einzutragen.
* @param lon {float} Länge in Google Projektion 900913.
* @param lat {float} Breite in Google Projektion 900913. */
function displayNewEventWindow(lon, lat)
{
    var EventForm = new Ext.form.FormPanel({
        frame:true,
        width:350,
        autoHeight: true,
        items: [

        new Ext.form.TextField({
            id         : "user_id",
            fieldLabel : "User Name",
            allowBlank : false,
            width      : 215
        }),

        new Ext.form.TextField({
            id         : "user_pwd",
            fieldLabel : "Password",
            inputType  : "password",
            allowBlank : false,
            width      : 215
        }),

        new Ext.form.TextField({
            id         : "event",
            fieldLabel : "Event Name",
            allowBlank : false,
            width      : 215
        }),

        new Ext.form.TextField({
            id         : "place",
            fieldLabel : "Place",
            allowBlank : false,
            emptyText  : "Enter location name...",   //blankText : "Enter here location name",
            width      : 215,
        }),

        new Ext.form.TextArea({
            id         : 'address',
            fieldLabel : 'Address',
            width      : 215,
        }),

        // Kategorien sind hier gespeichert
        new Ext.form.ComboBox({
            id: 'type',
            fieldLabel: 'Type',
            width: 215,
            emptyText: "Select a type...",
            store: new Ext.data.SimpleStore({
                id: 'typesimplestore',
                fields: [ 'typeID', 'typeLabel' ],
                data: [ [1, 'Musik'], [2, 'Comedy'], [3, 'Theater'], [4, 'Party'], [5, 'Sonstige'] ]
            }),
            displayField: 'typeLabel',
            valueField: 'typeID',
            selectOnFocus: true,
            mode: 'local',
            typeAhead: true,
            editable: false,
            triggerAction: 'all',
            value: 1
        }),

        new Ext.form.TextArea({
            id            : 'description',
            fieldLabel    : 'Description',
            width         : 215,
            maxLength     : 4000,
            maxLengthText : 'Max 4000 characters',
        }),


        new Ext.form.DateField({
            id         : 'date',
            fieldLabel : 'Date',
            width      : 215,
            emptyText  : 'Select a date...',
            //vtype    : 'daterange',
            format     : 'Y/m/d',
            allowBlank : false
        }),

        new Ext.form.TimeField({
            id: "time",
            width:215,
            emptyText: "Select a time...",
            format: 'H:i',
            fieldLabel: "Time",
            minValue: '0:00 AM',
            maxValue: '11:30 PM',
            increment: 30
        }),

        new Ext.form.TextField({
            id         : "lat_wgs84",
            allowBlank : false,
            width      : 215,
            value      : lat,
            hidden     : true // hidden coordinate field
        }),

        new Ext.form.TextField({
            id         : "lon_wgs84",
            allowBlank : false,
            width      : 215,
            value      : lon,
            hidden     : true // hidden coordinate field
        }),

        new Ext.form.TextField({
            id         : 'price',
            fieldLabel : 'Price',
            width      : 215,
            emptyText  : 'Enter price in Euro...',
        }),

        new Ext.form.TextField({
            id         : 'image_url',
            fieldLabel : 'Image URL',
            width      : 215,
            emptyText  : 'URL to an image file (or leave blank)',
        }),

        ], //close Items

        buttons: [{
            text: 'Submit',
            handler: function(){

                if(EventForm.getForm().isValid()){
                    EventForm.getForm().submit({
                        url: 'php/addevent.php',
                        waitMsg: 'Adding event...',
                        method: "POST", // sicherer für die passwörter
                        success: function(EventForm, resp){

                            // dem user sagen, dass alles geklappt hat
                            Ext.Msg.show({
                                title:'Add Event',
                                msg: 'Your event has been added.',
                                buttons: Ext.Msg.OK,
                                icon: Ext.MessageBox.INFO
                            });
			    nav.activate();
                            window.destroy();
                        },
                        failure: function(failureType, response) {
                            console.log('Problem?' + failureType + " " + response);

                            // dem user sagen, dass es nicht geklappt hat + fehlermeldung
                            Ext.Msg.show({
                                title:'Add Event',
                                msg: 'There is a problem with adding your event: ' + response.result.errormsg,
                                buttons: Ext.Msg.OK,
                                icon: Ext.MessageBox.WARNING
                            });
                        }

                    });
                }
            }
        }]
    });

    var window = new Ext.Window({
        id: 'EventWindow',
        title: 'Add Event',
        layout: 'fit',
        width: 355,
        autoHeight: true,
        closable: true,
        resizable: true,
        draggable: true,
        items: [EventForm]
    });

    window.show();
}

/** Zeigt einen ExtJS Dialog an um einen User hinzuzufügen. */
function displayNewUserWindow()
{
    var UserForm = new Ext.form.FormPanel({
        frame:true,
        width:300,

        items: [
            new Ext.form.TextField({
            id:"user_id",
            fieldLabel:"User Name",
            allowBlank:false,
            width:150
        }),

        new Ext.form.TextField({
            id:"password",
            fieldLabel:"Password",
            inputType: "password",
            allowBlank:false,
            width:150
        }),

        new Ext.form.TextField({
            id:"email",
            fieldLabel:"E-Mail",
            allowBlank:false,
            width:150
        }),
        ],

        buttons: [{
            text: 'Submit',
            handler: function(){

                if(UserForm.getForm().isValid()){
                    UserForm.getForm().submit({
                        url: 'php/adduser.php',
                        waitMsg: 'Adding user...',
                        method: "POST", // sicherer für die passwörter
                        success: function(UserForm, resp){

                            // dem user sagen, dass alles geklappt hat
                            Ext.Msg.show({
                                title:'Add User',
                                msg: 'Your user account has been added.',
                                buttons: Ext.Msg.OK,
                                icon: Ext.MessageBox.INFO
                            });

                            UserWindow.destroy();
                        },
                        failure: function(failureType, response) {
                            console.log('Problem?' + failureType + " " + response);

                            // dem user sagen, dass es nicht geklappt hat + fehlermeldung
                            Ext.Msg.show({
                                title:'Add User',
                                msg: 'There is a problem with adding your account: ' + response.result.errormsg,
                                buttons: Ext.Msg.OK,
                                icon: Ext.MessageBox.WARNING
                            });
                        }

                    });
                }
            }
        }]
    });

    var UserWindow = new Ext.Window({
        id: 'UserWindow',
        title: 'Register',
        layout: 'fit',
        width: 290,
        height: 160,
        closable: true,
        resizable: true,
        draggable: true,
        items: [UserForm]
    });

    UserWindow.show();

}

/** Prepare the main user interface with ExtJS. */
Ext.onReady(function() {

    Ext.QuickTips.init(); // so we can have those tooltips

    var options;  //Variables for options of Map
    var osm; //Variables for map layers
    // variables for our projection
    var googleProjection = new OpenLayers.Projection("EPSG:900913");
    var wgs84 = new OpenLayers.Projection("EPSG:4326");

    var extent = new OpenLayers.Bounds();

    extent.extend(new OpenLayers.LonLat(8.30, 49.05));
    extent.extend(new OpenLayers.LonLat(8.49, 48.96));
    // transform bounds coordinates from wgs 84 to googleProjection
    extent.transform(wgs84, googleProjection);

    options = {
        projection       : googleProjection,
        units            : "m",
        restrictedExtent : extent,
    };

    // langweiliger alter Openstreetmap style layer (wollen wir nicht)
    // osm = new OpenLayers.Layer.OSM();
    //
    // Cooler Open Street Maps Layer im neuen Style :-)
    var osm = new OpenLayers.Layer.OSM("OSM.de style", ["http://a.tile.openstreetmap.de/tiles/osmde/${z}/${x}/${y}.png",
                                       "http://b.tile.openstreetmap.de/tiles/osmde/${z}/${x}/${y}.png",
                                       "http://c.tile.openstreetmap.de/tiles/osmde/${z}/${x}/${y}.png",
                                       "http://d.tile.openstreetmap.de/tiles/osmde/${z}/${x}/${y}.png"],
                                       { type: 'png', visibility: true, attribution: '', isBaseLayer: true, });


    var map = new OpenLayers.Map('map', options); //create Mapobject
    map.addLayer(osm); // add openstreetmap layer to our map  
    map.addControl(new OpenLayers.Control.LayerSwitcher());
    map.zoomToExtent(extent);

    // Style Definitionen
    var style = new OpenLayers.Style({
        strokeColor: "#ff9933",
        strokeWidth: 2,
        fontColor: "#000000",
        fontFamily: "sans-serif",
        fontWeight: "bold",
	cursor: "pointer"
    }, {
        rules: [
            new OpenLayers.Rule({
	    title:"Musik",
            filter: new OpenLayers.Filter.Comparison({
                type: OpenLayers.Filter.Comparison.EQUAL_TO,
                property: "type",
                value: "Musik"
            }),
            symbolizer: {externalGraphic:'../image/famfamfam/icons/music.png', graphicWidth:'18', graphicHeight:'18', fillOpacity: 1}
        }),
        new OpenLayers.Rule({
	    title:"Comedy",
            filter: new OpenLayers.Filter.Comparison({
                type: OpenLayers.Filter.Comparison.EQUAL_TO,
                property: "type",
                value: "Comedy"
            }),
            symbolizer: {externalGraphic:'../image/famfamfam/icons/emoticon_grin.png', graphicWidth:'18', graphicHeight:'18', fillOpacity: 1}
        }),
        new OpenLayers.Rule({
	    title:"Party",
            filter: new OpenLayers.Filter.Comparison({
                type: OpenLayers.Filter.Comparison.EQUAL_TO,
                property: "type",
                value: "Party"
            }),
            symbolizer: {externalGraphic:'../image/famfamfam/icons/drink.png', graphicWidth:'18', graphicHeight:'18', fillOpacity: 1}
        }),
	new OpenLayers.Rule({
	    title:"Theater",
            filter: new OpenLayers.Filter.Comparison({
                type: OpenLayers.Filter.Comparison.EQUAL_TO,
                property: "type",
                value: "Theater"
            }),
            symbolizer: {externalGraphic:'../guy_fawkes_mask16.png', graphicWidth:'18', graphicHeight:'18', fillOpacity: 1}
        }),
        new OpenLayers.Rule({
	    title:"Sonstige",
            filter: new OpenLayers.Filter.Comparison({
                type: OpenLayers.Filter.Comparison.EQUAL_TO,
                property: "type",
                value: "Sonstige"
            }),
            symbolizer: {externalGraphic:'../image/famfamfam/icons/flag_red.png', graphicWidth:'18', graphicHeight:'18', fillOpacity: 1}
        })
        ]
    });

	var selectStyle = new OpenLayers.Style({
	  graphicWidth:'30', graphicHeight:'30'
	});


    g_vecLayer = new OpenLayers.Layer.Vector("Event locations", {styleMap: new OpenLayers.StyleMap({'default': style,
		                 'select': selectStyle})});


	map.addLayer(g_vecLayer); // add json data Layer to our map

    var ctrl, toolbarItems = [], action, actions = {};

    action = new GeoExt.Action({
        iconCls      : "zoom_in",
        map          : map,
        toggleGroup  : "tools",
        allowDepress : false,
        tooltip      : "Zoom in",
        control      : new OpenLayers.Control.ZoomBox({ in: true })
    });

    action["zoomin"] = action;
    toolbarItems.push(action);

    action = new GeoExt.Action({
            iconCls: "zoom_out",
            map: map,
            toggleGroup: "tools",
            allowDepress: false,
            tooltip: "Zoom out",
            control: new OpenLayers.Control.ZoomBox({
                out: true
            })
        });
    action["zoomout"] = action;
    toolbarItems.push(action);

    action = new GeoExt.Action({
	handler: function() {	Ext.select("div.olMap").setStyle({ cursor : "default" }); },
        control: new OpenLayers.Control.ZoomToMaxExtent(),
        map: map,
        text: "Max Extent",
        tooltip: "zoom to max extend",
        iconCls: 'zoom'
    })
    actions["max_extend"] = action;
    toolbarItems.push(action);
    nav = new OpenLayers.Control.Navigation(),
    action = new GeoExt.Action({
	handler: function() {	Ext.select("div.olMap").setStyle({ cursor : "default" }); },
	control: nav,
        map: map,
        toggleGroup: "tools",
        allowDepress: false,
        pressed: true,
        tooltip: "navigate",
        group: "draw",
        checked: true,
        iconCls: 'pan',
	out: false
    });
    actions["nav"] = action;
    toolbarItems.push(action);
    toolbarItems.push("-");

    OpenLayers.Control.NewEventControl =
        OpenLayers.Class(OpenLayers.Control, {
        defaultHandlerOptions: {
            'single'         : true,
            'double'         : true,
            'pixelTolerance' : 0,
            'stopSingle'     : false,
            'stopDouble'     : false
        },
        initialize: function(options) {
            this.handlerOptions = OpenLayers.Util.extend({},
                                                         this.defaultHandlerOptions);
                                                         OpenLayers.Control.prototype.initialize.apply(this, arguments);
                                                         this.handler = new OpenLayers.Handler.Click(this, {
                                                             'click': this.trigger
                                                         }, this.handlerOptions);
        },
        trigger: function(e) {
            var lonlat = map.getLonLatFromViewPortPx(e.xy);
            displayNewEventWindow(lonlat.lon, lonlat.lat);
            //console.log("You clicked near " + lonlat.lat + " N " + lonlat.lon + " E");
        },
    });

    var newevent = new OpenLayers.Control.NewEventControl();
    map.addControl(newevent);
    function activateNewEvent(){
	Ext.select("div.olMap").setStyle({ cursor : "crosshair" });
        newevent.activate();
    }
    action = new Ext.Action({
        handler      : activateNewEvent,
        map          : map,
        toggleGroup  : "tools",
        text         : "Add New Event",
        allowDepress : false,
        tooltip      : "New event",
        iconCls      : "info",
	out	     : true
    });
    actions["newevent"] = action;
    toolbarItems.push(action);

    g_datePicker = new Ext.DatePickerEvent({
        id: 'event-date-picker',
        startDay: 1, // montag als erster tag (wie es sein sollte)
        width: 298,
        //disabledDates: ['01/01/2012'],
        //format: 'd/m/y',
        listeners: {
            'select': {
                fn: function(datepicker, date) {
                    updateStore(g_store, date.format("Y-m-d"));
                },
                scope: this
            }
        }
    });

    g_store = new GeoExt.data.FeatureStore({
        layer: g_vecLayer,
        fields: [
            {name : 'event'       , type : "string"},
            {name : 'type'        , type : "string"},
            {name : 'place'       , type : "string"},
            {name : 'address'     , type : "string"},
            {name : 'date'        , type : "string"},
            {name : 'time'        , type : "string"},
            {name : 'price'       , type : "string"},
            {name : 'description' , type : "string"},
            {name : 'user_id'     , type : "string"},
            {name : 'image_url'   , type : "string"}
        ],
        /*
         *proxy: new GeoExt.data.ProtocolProxy({
         *    protocol: new OpenLayers.Protocol.HTTP({
         *        url: "php/db2json.php?date=",
         *        format: new OpenLayers.Format.GeoJSON()
         *    })
         *}),
         */
        //autoLoad: true,
        listeners: {
            /** Wir verwenden den load event um im Kalender die Tage mit einem Event
            *   als erlaubt zu markieren (setEnabledDates Funktion). */
            'load': function(store, /**Ext.data.Record[]*/ records, options)
            {
                onFeatureStoreData(store, records, options);
            }
        }
    });
    updateStore(g_store, "");

    /** Anzeigen von einer Legende */
    var legendPanel = new GeoExt.LegendPanel({
        title: "Legend",
        autoHeight: false,
        autoScroll: true,
	border: false,
    });

    /** Hier werden die Details zu den Events als HTML angezeigt. */
    var detailPanel = new Ext.Panel({
        title: "Details",
        html: "<h1></h1>",
        height: 540,  
	//autoHeight: true,
	//layout: "fit",   
        autoScroll: true,
        border: false
    });

    /** Hier werden die Events rechts oben angezeigt, der User
     * kann dann auf einen Event klicken und bekommt in der detailPanel
     * weitere Informationen angezeigt. */
    var gridPanel = new Ext.grid.GridPanel({
        title: "Events",
        region: "east",
        store: g_store,
        width: 298,
        height: 200,
        columns: [
            {header: "Name"   , width: 186, dataIndex: "event" },
            {header: "Type"   , width:  88, dataIndex: "type" }
        ],
        sm: new GeoExt.grid.FeatureSelectionModel(),
        listeners: {
            /** Wenn der User ein Event auswählt, wird hier der HTML String
             *  zusammengebastelt um die Detail Informationen im detailPanel
             *  anzuzeigen. */
            rowclick: function(grid, rowI, event) {
                var event = grid.getStore().getAt(rowI);
                var htmlstr = "<h2>" + event.data.event + "</h2>";
                    if(event.data.address != "?")
                        htmlstr += "Address: " + event.data.address + "<br/>";
                    htmlstr +=
                    "Date: " + event.data.date + "<br/>" +
                    "Place: " + event.data.place + "<br/>" +
                    "Price: " + event.data.price + "<br/>" +
                    "<br/>" + "Description: <br/><br/><i class=\"eventdescr\">" + event.data.description + "</i><br/>";

                    if(event.data.image_url.length > 0)
                        htmlstr += "<br/><img src=\"" + event.data.image_url + "\"/>";

                detailPanel.body.update(htmlstr);
            }
        }
    });

    var leftPanel = new Ext.Panel({
        //autoHeight: true,
        height: 350,
        autoScroll: true,
        border: false,
        items: [{
            xtype: "label",
            text: "To add events, you need to create an account: "
        }, {
            id: "registeruser",
            xtype: "button", //function in Ext, loads the map into the region
            text: "Register",
            handler: function(button, event) {
                displayNewUserWindow();
            }
        }],
    });

    var viewport =
         new Ext.Viewport({
         layout: "border", //north layout for title, east for legend, center for map
         items:  [{
             region: "north",
             contentEl: "title", //title from index.html soll in Nordregion stehen
             height: 50,
         }, {
             region: "center",
             id: "mappanel",
             xtype: "gx_mappanel", //function in Ext, loads the map into the region
             map: map,
             tbar: toolbarItems, //creates toolbaritems
             extent: extent,
             split: true
         }, {
             region: "east",
             items: [gridPanel, detailPanel],
             width: 300,
             collapsible: true, // Möglichkeit legende zu minimieren
             collapsed: false,  // by default Legende ist sichtbar
             split: true
         }, {
             region: "west",
             items: [g_datePicker, leftPanel, legendPanel],
             width: 178,
         }]
     });

     var datepicker = Ext.ComponentMgr.get('event-date-picker');
     //datepicker.setDisabledDates(['12/17/2011', '12/18/2011']);
});

// Code graveyard
// ----------------------------------------------------------------------

/*
 *Txt_BirthDate = new Ext.form.DateField({
 *    id: 'BirthDate',
 *    fieldLabel: 'Birth date',
 *    vtype: 'daterange',
 *    format: 'd/m/Y',
 *    allowBlank: false,
 *    anchor : '32%'
 *});
 */

