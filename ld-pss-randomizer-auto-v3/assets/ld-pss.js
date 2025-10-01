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
                var max = response.data.count;
                var $select = $('#ld-pss-num');
                $select.empty();

                for (var i = 20; i <= max; i += 10) {
                    $select.append('<option value="'+i+'">'+i+'</option>');
                }
            } else {
                alert("Erro ao buscar quantidade de questões: " + (response.data && response.data.msg ? response.data.msg : "desconhecido"));
            }
        });

        $('#ld-pss-start').on('click', function(e){
            e.preventDefault();
            var val = parseInt($('#ld-pss-num').val(), 10);
            if (isNaN(val) || val < 20) {
                alert('Por favor escolha um número válido (mínimo 20).');
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
                alert("Não foi possível localizar o botão nativo do quiz.");
            }
        });

    });
})(jQuery);
