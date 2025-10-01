<?php
/*
Plugin Name: LD PSS Randomizer Auto v3
Description: Seleciona quantidade de questões aleatórias no LearnDash e injeta seletor diretamente no quiz (sem shortcode). Corrige mapeamento de quiz_id para pro_quiz_id com fallback.
Version: 1.3
Author: ChatGPT
*/

if ( ! defined( 'ABSPATH' ) ) exit;

class LD_PSS_Randomizer_Auto_v3 {

    public function __construct() {
        add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_assets' ] );
        add_action( 'wp_ajax_ld_pss_get_max_questions', [ $this, 'get_max_questions' ] );
        add_action( 'wp_ajax_nopriv_ld_pss_get_max_questions', [ $this, 'get_max_questions' ] );
        add_filter( 'learndash_quiz_preload_questions', [ $this, 'limit_questions' ], 10, 2 );
        add_filter( 'the_content', [ $this, 'inject_selector' ], 20 );
    }

    public function enqueue_assets() {
        wp_enqueue_script( 'ld-pss-js', plugin_dir_url(__FILE__) . 'assets/ld-pss.js', ['jquery'], '1.3', true );
        wp_localize_script( 'ld-pss-js', 'ld_pss_ajax', [
            'ajaxurl' => admin_url( 'admin-ajax.php' ),
        ]);
    }

    private function detect_question_table( $wpdb ) {
        $table1 = $wpdb->prefix . "wp_pro_quiz_question";
        $table2 = $wpdb->prefix . "wp_wp_pro_quiz_question";
        if ($wpdb->get_var("SHOW TABLES LIKE '{$table2}'") === $table2) {
            return $table2;
        }
        return $table1;
    }

    private function get_pro_quiz_id( $quiz_post_id ) {
        global $wpdb;
        $table1 = $wpdb->prefix . "learndash_pro_quiz_pro";
        $table2 = $wpdb->prefix . "learndash_pro_quiz";

        $pro_quiz_id = 0;
        if ($wpdb->get_var("SHOW TABLES LIKE '{$table1}'") === $table1) {
            $pro_quiz_id = $wpdb->get_var( $wpdb->prepare("SELECT quiz_pro_id FROM {$table1} WHERE quiz_post_id = %d", $quiz_post_id) );
        }
        if (!$pro_quiz_id && $wpdb->get_var("SHOW TABLES LIKE '{$table2}'") === $table2) {
            $pro_quiz_id = $wpdb->get_var( $wpdb->prepare("SELECT quiz_pro_id FROM {$table2} WHERE quiz_post_id = %d", $quiz_post_id) );
        }

        return intval($pro_quiz_id);
    }

    public function get_max_questions() {
        global $wpdb;
        $quiz_id = intval($_POST['quiz_id']);
        if (!$quiz_id) wp_send_json_error(['msg' => 'quiz_id inválido']);

        $pro_quiz_id = $this->get_pro_quiz_id($quiz_id);
        if (!$pro_quiz_id) wp_send_json_error(['msg' => 'pro_quiz_id não encontrado para quiz_post_id=' . $quiz_id]);

        $table = $this->detect_question_table($wpdb);
        $count = $wpdb->get_var( $wpdb->prepare("SELECT COUNT(*) FROM $table WHERE quiz_id = %d", $pro_quiz_id) );
        wp_send_json_success([ 'count' => intval($count) ]);
    }

    public function limit_questions( $questions, $quiz_id ) {
        $cookie_name = 'ld_pss_' . $quiz_id;
        $limit = isset($_COOKIE[$cookie_name]) ? intval($_COOKIE[$cookie_name]) : 0;

        if ( $limit > 0 && count($questions) > $limit ) {
            $keys = array_keys($questions);
            shuffle($keys);
            $selected_keys = array_slice($keys, 0, $limit);
            $new_questions = [];
            foreach ($selected_keys as $key) {
                $new_questions[$key] = $questions[$key];
            }
            return $new_questions;
        }
        return $questions;
    }

    public function inject_selector( $content ) {
        if ( get_post_type() === 'sfwd-quiz' && is_singular('sfwd-quiz') ) {
            global $post;
            $quiz_id = $post->ID;
            ob_start(); ?>
            <div id="ld-pss-wrapper" data-quiz-id="<?php echo esc_attr($quiz_id); ?>" style="margin-bottom:20px;">
                <label for="ld-pss-num">Escolha a quantidade de questões:</label>
                <select id="ld-pss-num" aria-label="Quantidade de questões">
                    <option value="">Carregando opções...</option>
                </select>
                <button id="ld-pss-start" class="button">Iniciar Quiz</button>
                <button id="ld-pss-native-start" style="display:none;">Start Native</button>
            </div>
            <?php
            $selector_html = ob_get_clean();
            return $selector_html . $content;
        }
        return $content;
    }
}

new LD_PSS_Randomizer_Auto_v3();
