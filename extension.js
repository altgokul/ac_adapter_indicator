
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
			style_class: 'system-status-icon' });

		let transition = new Clutter.PropertyTransition();
		transition.set_property_name('opacity');
		transition.set_from(0);
		transition.set_to(255);
		transition.set_duration(1000);
		transition.set_repeat_count(1);
		transition.set_progress_mode(Clutter.AnimationMode.EASE_IN_OUT_CUBIC);
		this.icon.transition = transition;
		this.icon.add_transition('opacityAnimation', transition);

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
        let visible = this._proxy.Online;
		let transition = this.icon.transition;

		log('ACPowerIndicator: sync, visible: '  + visible);
        if (visible) {
			transition.stop();
			transition.set_repeat_count(1);
			transition.set_from(0);
			transition.set_to(255);
			transition.set_auto_reverse(false);
        	this.icon.icon_name = this._proxy.IconName;
			transition.start();
        } else {
			transition.stop();
			transition.set_repeat_count(-1);
			transition.set_from(0);
			transition.set_to(255);
			transition.set_auto_reverse(true);
            this.icon.icon_name = 'battery-empty-symbolic';
			transition.start();
        }
    },

});

let button, indicator;

function init() {
	indicator = new Indicator();
}

function enable() {
    Main.panel._rightBox.insert_child_at_index(indicator.button, 0);
}

function disable() {
    Main.panel._rightBox.remove_child(indicator.button);
}

