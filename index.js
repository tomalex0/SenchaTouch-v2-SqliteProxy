var modelobj,contactStore;
Ext.ns('DbConnection');


var calculateDesiredWidth = function() {
	var viewWidth = Ext.Viewport.getWindowWidth();
	desiredWidth = Math.min(viewWidth, 400) - 10;
	return desiredWidth;
};

Ext.setup({
	tabletStartupScreen: 'tablet_startup.png',
	phoneStartupScreen: 'phone_startup.png',
	icon: 'icon.png',
	glossOnIcon: false,
	onReady: function() {
		
		var dbconnval = {
			dbName: "contacts",
			dbDescription: "testdb"
		};

		//Ext.DbConnection = new Ext.Sqlite.Connection(dbconnval);
		Ext.DbConnection = Ext.create('Ext.Sqlite.Connection',dbconnval);
		
		

		Ext.define("Contacts", {
			extend: "Ext.data.Model",
			
			config : {
				idProperty : 'uniqueid', // if we have field with name as id, conflicts happens with default idProperty(id) which always have value as ext-record-x
				clientIdProperty : 'id',
				fields: [{
					name: 'firstName',
					type: 'string'
				}, {
					name: 'lastName',
					type: 'string'
				},{
					name: 'id',
					type: 'int',
					fieldOption: 'PRIMARY KEY'
				}, {
					name: 'modifyDate',
					type: 'string',
					isTableField:true
	
				}, {
					name: 'modifyDateParsed',
					type: 'string',
					mapping: 'modifyDate', // not working
					isTableField: false,//newly implemented to distinguish field
					convert: function(value, rec) {
						
						var dt	=  Ext.Date.parseDate(rec.get('modifyDate'), "Y-m-d H:i:s")
						newval	=  Ext.Date.format(dt,'M j, Y, g:i a')
						return newval;
					}
				}],
				proxy: {
				type: 'sqlitestorage',
				dbConfig: {
					tablename: 'contacts_tables',
					dbConn: Ext.DbConnection
					//dbQuery 	: 'SELECT * FROM contact_table limit 0,1' //dbQuery only works with read operation
				},
				reader: {
					type: 'array'
				}
			}	
			},
			writer: {
				type: 'array'
			}
		});
		
		
			
		contactStore =  Ext.create('Ext.data.Store',{
			model  : 'Contacts',
			autoLoad: true
		});
		
		
		//create add panel
		var addPnl = Ext.create('Ext.form.Panel', {
			hidden: true,
			centered: true,
			modal  : true,
			height : 300,
			hideOnMaskTap : false,
			width : calculateDesiredWidth(),
			items : [{
					xtype : 'formpanel'
				},{
				xtype: 'fieldset',
				defaults:{
					labelWidth : '45%'
				},
				items: [{
					xtype: 'textfield',
					label: 'First Name',
					name: 'firstName'
				}, {
					xtype: 'textfield',
					label: 'Last Name',
					name: 'lastName'
				}]
			},{
				docked: 'top',
				xtype: 'toolbar',
				title: 'Add User'
			},{
				docked: 'bottom',
				xtype: 'toolbar',
				items :[{
					text: 'Cancel',
					align : 'right',
					handler: function() {
						addPnl.hide();
					}
				},{
					xtype : 'spacer'
				},{
					text: 'Add',
					ui: 'action',
					align : 'right',
					handler: function() {
						var mainform = addPnl;
						var formval = mainform.getValues();
						if (!Ext.isEmpty(formval.firstName) && !Ext.isEmpty(formval.lastName)) {
							var dt = new Date();
							var dateval = Ext.Date.format(dt,"Y-m-d H:i:s");
							formval.modifyDate = dateval;
							console.log(formval,"val");
							var rec = Ext.create('Contacts', formval).save();
							console.log(rec,"blahsadsflskflskd")
							contactStore.load();
							mainform.reset();
							addPnl.hide();
						} else {
							alert("Enter Values");
						}
					}
				}]
			}]
		});
		
		//create edit panel
		var editPnl = Ext.create('Ext.form.Panel', {
			centered: true,
			modal  : true,
			height : 300,
			hideOnMaskTap : false,
			width : calculateDesiredWidth(),
			items : [{
				xtype: 'fieldset',
				defaults: {
					labelWidth: '40%'
				},
				items: [{
					xtype: 'textfield',
					label: 'First Name',
					name: 'firstName'
				}, {
					xtype: 'hiddenfield',
					name: 'id'
				}, {
					xtype: 'textfield',
					label: 'Last Name',
					name: 'lastName'
				}, {
					xtype: 'textfield',
					disabled: true,
					label: 'Last Modified',
					name: 'modifyDateParsed'
				}]
			},{
				docked: 'top',
				xtype: 'toolbar',
				title: 'Edit User'
			},{
				docked: 'bottom',
				xtype: 'toolbar',
				items :[{
					text: 'Cancel',
					align : 'right',
					handler: function() {
						editPnl.hide();
					}
				},{
					xtype : 'spacer'
				},{
					text: 'Update',
					ui: 'action',
					align : 'right',
					handler: function() {
						var mainform = editPnl;
						var formval = mainform.getValues();
						if (!Ext.isEmpty(formval.firstName) && !Ext.isEmpty(formval.lastName)) {
							var dt = new Date();
							var dateval = Ext.Date.format(dt,"Y-m-d H:i:s");
							formval.modifyDate = dateval;
							console.log(formval,"formval")
							var rec = Ext.create('Contacts', formval,formval.id);
							rec.save();
							contactStore.load();
							editPnl.hide();
						} else {
							alert("Enter Values");
						}
					}
				}]
			}]
		});
		
		//create main panel
		var mainPanel = Ext.create('Ext.Panel', {
			fullscreen: true,
			layout: 'fit',
			items : [{
				xtype : 'titlebar',
				docked: 'top',
                title: 'SQlite DB',
                items: [{
					text: 'Clear DB',
					ui: 'decline',
					align : 'left',
					handler: function() {
						var p = contactStore.getProxy();
						p.truncate('contact_table');
						contactStore.load();
					}
				}, {
					text: 'Add User',
					ui: 'action',
					align : 'right',
					handler: function() {
						Ext.Viewport.add(addPnl)
						addPnl.show();
					}
				}]
			},{
				xtype : 'toolbar',
				docked : 'top',
				items : [{
					xtype : 'spacer'
				},{
					xtype      : 'textfield',
					align : 'center',
					itemId :'searchfield',
					placeHolder: 'Search Firstname',
					listeners :{
						keyup: function(field) {
							var value = field.getValue();
							console.log(value);
							
							contactStore.load({params :{ name: value},query : 'select * from contacts_tables WHERE firstName = ?'});
							console.log(contactStore,"contactStore");
						}
					}
				},{
					text : 'Reset',
					ui  : 'action',
					handler : function(){
						mainPanel.query("#searchfield")[0].setValue('');
						contactStore.load();
					}
				},{
					xtype : 'spacer'
				}]
			},{
                xtype: 'list',
                store: contactStore,
				onItemDisclosure: function(rec) {
					console.log(rec);
					var contactmodel = Ext.ModelMgr.create(rec.data, 'Contacts');
					editPnl.setRecord(contactmodel);
					Ext.Viewport.add(editPnl);
					editPnl.show();
				},
				itemTpl: ['<div >{firstName} {lastName} </div>',
						'<div>{modifyDateParsed}</div>',
						'<div class="delete"></div>'],
				listeners: {
					itemtap: function(view, index, item,record, e) {
						console.log(e);
						if (e.getTarget(".delete")) {
							var rec = view.getStore().getAt(index);
							console.log(rec,"recird");;
							var user = Ext.create('Contacts',{
								firstName: "sdfsdf",
								id: 4,
								lastName: "das",
								modifyDate: "2012-03-03 01:11:19"
							});
							console.log(user,"sadfsdfsdsdf");
							rec.destroy();
							//view.getStore().remove(rec);
						}
					}
				}
            }]
		});
	}
});