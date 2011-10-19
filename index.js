var modelobj,contactStore;
Ext.ns('DbConnection');


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

		Ext.DbConnection = new Ext.Sqlite.Connection(dbconnval);
		
		var calculateDesiredWidth = function() {
			var viewWidth = Ext.Element.getViewportWidth(),
			desiredWidth = Math.min(viewWidth, 400) - 10;
			return desiredWidth;
		};


		Ext.define("Contacts", {
			extend: "Ext.data.Model",
			fields: [{
				name: 'firstName',
				type: 'string'
			}, {
				name: 'lastName',
				type: 'string',
				mapping : 'firstName'
			}, {
				name: 'ID',
				type: 'int',
				fieldOption: 'PRIMARY KEY ASC'
			}, {
				name: 'modifyDate',
				type: 'string'

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
					dbConn: Ext.DbConnection.dbConn
					//dbQuery 	: 'SELECT * FROM contact_table limit 0,1' //dbQuery only works with read operation
				},
				reader: {
					type: 'array',
					idProperty: 'ID'
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
			centered: true,
			modal  : true,
			height : 300,
			hideOnMaskTap : false,
			width : calculateDesiredWidth(),
			items : [{
				xtype: 'fieldset',
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
				title: 'Edit User'
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
							var rec = Ext.ModelMgr.create(formval, 'Contacts').save();
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
					name: 'ID'
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
					text: 'Add',
					ui: 'action',
					align : 'right',
					handler: function() {
						var mainform = editPnl;
						var formval = mainform.getValues();
						if (!Ext.isEmpty(formval.firstName) && !Ext.isEmpty(formval.lastName)) {
							var dt = new Date();
							var dateval = Ext.Date.format(dt,"Y-m-d H:i:s");
							formval.modifyDate = dateval;
							var rec = Ext.ModelMgr.create(formval, 'Contacts', formval.ID).save();
							contactStore.load();
							mainform.reset();
							editPnl.hide();
						} else {
							alert("Enter Values");
						}
					}
				}]
			}]
		});
		
		//create main panel
		Ext.create('Ext.Panel', {
            fullscreen: true,
			layout: 'fit',
			items : [{
				xtype : 'navigationbar',
				docked: 'top',
                title: 'Edit User',
                items: [{
					text: 'Clear DB',
					ui: 'decline',
					align : 'right',
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
						addPnl.show();
					}
				}]
			},{
                xtype: 'list',
                store: contactStore,
				onItemDisclosure: function(rec) {
					console.log(rec);
					var contactmodel = Ext.ModelMgr.create(rec.data, 'Contacts');
					editPnl.loadModel(contactmodel);
					editPnl.show();
				},
				itemTpl: '<div style="float:left;">{firstName} {lastName} - Last modified on {modifyDateParsed}</div><div class="x-button x-button-decline delete" style="float:right;text-align:right;margin-right:2em;margin-top:-5px;">Delete</div>',
				listeners: {
					itemtap: function(view, index, item, e) {
						
						if (e.getTarget(".delete")) {
							var rec = view.getStore().getAt(index);
							var user = Ext.ModelMgr.create(rec.data, 'Contacts');
							user.destroy();
							view.getStore().remove(rec);
						}
					}
				}
            }]
		});
	}
});