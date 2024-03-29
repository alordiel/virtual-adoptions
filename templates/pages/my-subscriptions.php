<?php
/**
 * Template name: VirtualAdopt -  List of subscriptions
 */

// If user is not logged in - redirect to login page
if ( ! is_user_logged_in() ) {
	$settings = get_option( 'va-settings' );
	wp_redirect( get_permalink( $settings['page']['login'] ) );
}

get_header();
$user_id = wp_get_current_user();
?>

<?php
$subscriptions = get_posts( [
	'post_type'     => 'va-subscription',
	'post_per_page' => - 1,
	'post_status'   => 'any',
	'post_author'   => $user_id,
	'orderby'       => 'post_date',
	'order'         => 'DESC',
] );
$edit_profile =  get_edit_profile_url();
?>
	<div class="va-container" style="padding-top: 20px">
		<p>
			<?php echo  sprintf(__('You can edit your profile form <a href="%s">here</a>.','virtual-adoptions'), $edit_profile)?>
		</p>

		<?php
		if ( ! empty( $subscriptions ) ) {
			?>
			<h5><?php _e( 'This is the list of your subscriptions', 'virtual-adoptions' ); ?></h5>
			<div class="manage-my-subscriptions">
				<?php
				global $wpdb;
				$VA_paypal = new VA_PayPal();
				foreach ( $subscriptions as $subscription ) {
					$sql     = "SELECT * FROM {$wpdb->prefix}va_subscriptions WHERE post_id = $subscription->ID";
					$details = $wpdb->get_row( $sql );
					if ( empty( $details ) ) {
						echo sprintf( __( 'We are missing details for subscription with ID %d', 'virtual-adoptions' ), $subscription->ID );
						echo '<br>';
						continue;
					}

					$post_id        = $details->post_id;
					$animal         = get_post( $details->sponsored_animal_id );
					$paypal_details = $VA_paypal->get_subscription_details( $details->paypal_id );
					$image          = get_the_post_thumbnail_url( $details->sponsored_animal_id, 'medium' );
					$is_cancelled   = $details->status === 'va-cancelled' || $paypal_details['status'] === 'CANCELLED';
					$cancelled_date = '';

					if ( $paypal_details['status'] === 'CANCELLED' ) {
						$next_due       = '';
						$cancelled_date = date( 'Y-m-d', strtotime( $details->cancellation_date ) );
						$status         = __( 'Cancelled', 'virtual-adoptions' );
					} else {
						$next_due = date( 'Y-m-d', strtotime( $paypal_details['billing_info']['next_billing_time'] ) );
						$status   = va_get_verbose_subscription_status( $details->status );
					}
					?>
					<div class="my-sponsored-animal-card card-id-<?php echo $post_id ?>">
						<div class="animal-card-image" style="background-image: url('<?php echo $image; ?>')"></div>
						<p><?php _e( 'Name', 'virtual-adoptions' ) ?>:
							<a href="<?php echo get_permalink( $animal->ID ) ?>">
								<?php echo $animal->post_title; ?>
							</a>
						</p>
						<p>
							<?php echo __( 'Monthly donation', 'virtual-adoptions' ) . ': ' . $details->amount . ' ' . $details->currency ?>
						</p>

						<?php if ( ! empty( $next_due ) && ! $is_cancelled ) : ?>
							<p class="next-due-date">
								<?php echo __( 'Next payment', 'virtual-adoptions' ) . ': ' . $next_due ?>
							</p>
						<?php else : ?>
							<p>
								<small>
									<?php echo sprintf( __( 'Cancelled on %s', 'virtual-adoptions' ), $cancelled_date ); ?>
								</small>
							</p>
						<?php endif; ?>

						<?php if ( ! $is_cancelled ) : ?>
							<p class="subscription-status">
								<?php echo __( 'Subscription status', 'virtual-adoptions' ) . ': ' . $status ?>
							</p>
						<?php endif; ?>
						<p class="card-actions">
							<?php
							if ( $details->status === 'va-active' && ! $is_cancelled ) {
								?>
								<a href="#" class="cancel-button" data-post-id="<?php echo $post_id ?>">
									<?php _e( 'Cancel subscription', 'virtual-adoptions' ) ?>
									<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
										<path
											d="M304 48c0-26.5-21.5-48-48-48s-48 21.5-48 48s21.5 48 48 48s48-21.5 48-48zm0 416c0-26.5-21.5-48-48-48s-48 21.5-48 48s21.5 48 48 48s48-21.5 48-48zM48 304c26.5 0 48-21.5 48-48s-21.5-48-48-48s-48 21.5-48 48s21.5 48 48 48zm464-48c0-26.5-21.5-48-48-48s-48 21.5-48 48s21.5 48 48 48s48-21.5 48-48zM142.9 437c18.7-18.7 18.7-49.1 0-67.9s-49.1-18.7-67.9 0s-18.7 49.1 0 67.9s49.1 18.7 67.9 0zm0-294.2c18.7-18.7 18.7-49.1 0-67.9S93.7 56.2 75 75s-18.7 49.1 0 67.9s49.1 18.7 67.9 0zM369.1 437c18.7 18.7 49.1 18.7 67.9 0s18.7-49.1 0-67.9s-49.1-18.7-67.9 0s-18.7 49.1 0 67.9z"/>
									</svg>
								</a>
								<?php
							}
							?>
						</p>
					</div>
				<?php } ?>
			</div>
			<?php wp_nonce_field( 'va-taina', 'turbo-security' ); ?>
			<?php
		} else {
			$animal_archive_link = get_post_type_archive_link( 'sheltered-animal' );
			?>
			<h5>
				<?php echo sprintf( __( 'No subscriptions found. You can check our animals waiting for your sponsorship <a href="%s">here</a>.', 'virtual-adoptions' ), $animal_archive_link ) ?>
			</h5>
			<?php
		}
		?>
	</div>
<?php
get_footer();
