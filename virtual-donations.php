<?php
/**
 * Plugin Name:       Virtual Adoptions
 * Plugin URI:        https://github.com/alordiel/virtual-adiptions
 * Description:       This plugin creates the options to add animals from your shelter for virtual adoption. The payment is done on monthly bases by PayPal.
 * Version:           1.1.0
 * Requires at least: 5.9.1
 * Requires PHP:      7.4.0
 * Author:            Alexander Vasilev
 * Author URI:        https://timelinedev.com/
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       virtual-adoptions
 * Domain Path:       /languages/
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}


$uploads_dir = wp_get_upload_dir();
const VA_ABS = __DIR__;
define( 'VA_URL', untrailingslashit( plugin_dir_url( __FILE__ ) ) );
define( "VA_UPLOADS_ABS", $uploads_dir['basedir'] );

require_once( VA_ABS . '/include/custom-post-types/animals.php' );
require_once( VA_ABS . '/include/custom-post-types/va-subscriptions.php' );
require_once( VA_ABS . '/include/custom-post-types/va-subscription-plans.php' );
require_once( VA_ABS . '/include/template-loader.php' );
require_once( VA_ABS . '/include/functions.php' );
require_once( VA_ABS . '/include/wordpress.php' );
require_once( VA_ABS . '/include/enqueue-scripts-and-styles.php' );
require_once( VA_ABS . '/include/admin-settings.php' );
require_once( VA_ABS . '/include/ajax.php' );
require_once( VA_ABS . '/include/database-tables.php' );
require_once( VA_ABS . '/include/subscriptions.php' );
require_once( VA_ABS . '/include/mails.php' );
require_once( VA_ABS . '/include/webhooks.php' );
require_once( VA_ABS . '/include/VA_PayPal.php' );
require_once( VA_ABS . '/include/crypt.php' );
require_once( VA_ABS . '/include/admin-dashboard-widget.php' );


/**
 * Functions to execute on activation of the plugin.
 */
function va_plugin_activated() {

	// Registers the custom post type plugin.
	if ( ! post_type_exists( 'sheltered-animal' ) ) {
		va_sheltered_animals();
		sheltered_animal_taxonomy();
		va_register_meta_boxes();
		va_subscription_post_type();
	}

	// Checks if we have all the required pages and if not - it will create them
	$va_settings = get_option( 'va-settings' );
	if ( empty( $va_settings['page']['checkout'] ) ) {
		va_create_template_page( 'checkout' );
	}
	if ( empty( $va_settings['page']['thank-you'] ) ) {
		va_create_template_page( 'thank-you' );
	}
	if ( empty( $va_settings['page']['my-subscriptions'] ) ) {
		va_create_template_page( 'my-subscriptions' );
	}
	if ( empty( $va_settings['page']['login'] ) ) {
		va_create_template_page( 'login' );
	}
	// Clear the permalinks after the post type has been registered.
	flush_rewrite_rules();

	va_create_subscription_tables(); // Adds the DataBase
	va_create_log_files(); // Adds 2 files in wp-uploads/virtual-adoptions for reporting purposes
	va_custom_post_status_for_subscriptions(); // Adds custom post statuses for the custom post type subscriptions

	// Add custom role for virtual adopters
	add_role( 'virtual-adopter', 'Virtual Adopter',  get_role( 'subscriber' )->capabilities );
}

register_activation_hook( __FILE__, 'va_plugin_activated' );
