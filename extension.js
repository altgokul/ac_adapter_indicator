
const St = imports.gi.St;
const Main = imports.ui.main;
const Tweener = imports.ui.tweener;



const Gio = imports.gi.Gio;
const Clutter = imports.gi.Clutter;
const Lang = imports.lang;
const UPower = imports.gi.UPowerGlib;
const PanelMenu = imports.ui.panelMenu;

const BUS_NAME = 'org.freedesktop.UPower';
const OBJECT_PATH = '/org/freedesktop/UPower/devices/line_power_ADP1';

const DisplayDeviceInterface = '<node> \
<interface name="org.freedesktop.UPower.Device"> \
  <property name="Type" type="u" access="read"/> \
  <property name="Online" type="b" access="read"/> \
  <property name="IconName" type="s" access="read"/> \
</interface> \
</node>';

const PowerManagerProxy = Gio.DBusProxy.makeProxyWrapper(DisplayDeviceInterface);

const SHOW_BATTERY_PERCENTAGE       = 'show-battery-percentage';


let Indicator = new Lang.Class({
    Name: 'ACPowerIndicator',

	_init: function() {
		log('ACPowerIndicator: Init');

		this.button = new St.Bin({ style_class: 'panel-button',
			reactive: true,
			can_focus: false,
			x_fill: true,
			y_fill: false,
			track_hover: false });

		this.icon = new St.Icon({ icon_name: 'ac-adapter-symbolic',
			style_class: 'system-status-icon-blink' });

		this.button.set_child(this.icon);

		this._proxy = new PowerManagerProxy(Gio.DBus.system, BUS_NAME, OBJECT_PATH,
				Lang.bind(this, function(proxy, error) {
					if (error) {
						log(error.message);
						return;
					}
					this._proxy.connect('g-properties-changed',
							Lang.bind(this, this._sync));
					this._sync();
				}));

	},

    _sync: function() {
        // Do we have batteries or a UPS?
        let visible = this._proxy.Online;
		log('ACPowerIndicator: sync, visible: '  + visible);
        if (visible) {
        	this.icon.icon_name = this._proxy.IconName;
			this.icon.style_class =  'system-status-icon';
        } else {
            // If there's no battery, then we use the power icon.
            this.icon.icon_name = 'battery-empty-symbolic';
			this.icon.style_class =  'system-status-icon-alert';
        }
    },

});

let button, indicator;

function init() {
	/*
    button = new St.Bin({ style_class: 'panel-button',
                          reactive: true,
                          can_focus: false,
                          x_fill: true,
                          y_fill: false,
                          track_hover: false });
    let icon = new St.Icon({ icon_name: 'ac-adapter-symbolic',
                             style_class: 'system-status-icon' });

    button.set_child(icon);
	*/
	indicator = new Indicator();
}

function enable() {
    Main.panel._rightBox.insert_child_at_index(indicator.button, 0);
	log('ACPowerIndicator: enabled ');
}

function disable() {
    Main.panel._rightBox.remove_child(indicator.button);
	log('ACPowerIndicator: disabled');
}

