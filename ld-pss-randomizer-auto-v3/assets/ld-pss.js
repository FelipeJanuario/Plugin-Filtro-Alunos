(function($){
    $(document).ready(function(){

        var $wrapper = $('#ld-pss-wrapper');
        if ($wrapper.length === 0) return;

        var quizId = $wrapper.data('quiz-id');

        // Busca total de questões via AJAX
        $.post(ld_pss_ajax.ajaxurl, {
            action: 'ld_pss_get_max_questions',
            quiz_id: quizId
        }, function(response){
            if (response.success) {
                    var max = parseInt(response.data.count, 10) || 0;
                    var $select = $('#ld-pss-num');
                    $select.empty();

                    // Se houver muitas questões, oferecemos opções a partir de 20 em 10 em 10
                    if (max >= 20) {
                        for (var i = 20; i <= max; i += 10) {
                            $select.append('<option value="'+i+'">'+i+'</option>');
                        }
                    } else if (max > 0) {
                        // Se houver menos que 20 questões, geramos opções sensatas de 1 até max
                        var step = (max <= 10) ? 1 : Math.ceil(max / 5);
                        for (var j = 1; j <= max; j += step) {
                            $select.append('<option value="'+j+'">'+j+'</option>');
                        }
                        // garantir que o valor máximo esteja presente
                        if ($select.find('option[value="'+max+'"]').length === 0) {
                            $select.append('<option value="'+max+'">'+max+'</option>');
                        }
                    } else {
                        $select.append('<option value="">Sem questões disponíveis</option>');
                        $('#ld-pss-start').prop('disabled', true);
                    }

                    // guardar max para validação posterior
                    $select.data('ld-pss-max', max);
                } else {
                    var msg = (response.data && response.data.msg) ? response.data.msg : "desconhecido";
                    if (response.data && response.data.debug) {
                        msg += '\n\nDebug info: tabelas testadas: ' + (response.data.debug.tables_tested || []).join(', ');
                    }
                    alert("Erro ao buscar quantidade de questões: " + msg);
                }
        });

        $('#ld-pss-start').on('click', function(e){
            e.preventDefault();
            var val = parseInt($('#ld-pss-num').val(), 10);
            var maxQuestions = parseInt($('#ld-pss-num').data('ld-pss-max'), 10) || 0;
            if (isNaN(val) || val <= 0) {
                alert('Por favor escolha um número válido.');
                return;
            }
            if (maxQuestions > 0 && val > maxQuestions) {
                alert('O número escolhido é maior que o total de questões disponíveis (' + maxQuestions + ').');
                return;
            }

            var cname = 'ld_pss_' + quizId;
            var d = new Date();
            d.setTime(d.getTime() + (60*60*1000));
            var expires = "expires="+ d.toUTCString();
            document.cookie = cname + "=" + val + ";" + expires + ";path=/";

            // dispara o clique no botão nativo escondido
            var nativeBtn = $('#ld-pss-native-start');
            if (nativeBtn.length) {
                nativeBtn.trigger('click');
            } else {
                // fallback: tente localizar botões nativos comuns do LearnDash / WP Pro Quiz
                var selectors = [
                    '#ld-pss-native-start',
                    '.wpProQuiz_startQuizButton', // WP Pro Quiz
                    '.wpProQuiz_button',
                    '.learndash_start_quiz',
                    '.ld-start-quiz',
                    '.start-quiz',
                    'button.start_quiz',
                    'button#start_quiz',
                    'button[data-quiz-start]',
                    'button[type=submit]'
                ];
                var found = null;
                for (var si = 0; si < selectors.length; si++) {
                    var $el = $(selectors[si]);
                    if ($el.length) { found = $el.first(); break; }
                }
                if (found) {
                    found.trigger('click');
                } else {
                    // último recurso: informar ao usuário e manter o cookie salvo
                    alert("Não foi possível localizar automaticamente o botão nativo do quiz. O número escolhido foi salvo; por favor inicie o quiz manualmente.");
                }
            }
        });

    });
})(jQuery);
