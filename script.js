let agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];

// Senha administrativa configurada
const SENHA_MESTRE = "Maria@!1990Rd";

const INICIO_EXPEDIENTE = 8 * 60;
const FIM_EXPEDIENTE = 18 * 60;
const INTERVALO_OPCOES = 30;

document.addEventListener("DOMContentLoaded", () => {
    atualizarListaUI();
    bloquearDatasPassadas();
});

function bloquearDatasPassadas() {
    const campoData = document.getElementById("data");
    const hoje = new Date().toISOString().split("T")[0];
    campoData.setAttribute("min", hoje);
}

function copiarPix() {
    const chavePixInput = document.getElementById("chave-pix");
    chavePixInput.select();
    chavePixInput.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(chavePixInput.value);
    alert("Chave Pix copiada com sucesso!");
}

function horaParaMinutos(horaStr) {
    const [horas, minutos] = horaStr.split(":").map(Number);
    return horas * 60 + minutos;
}

function minutosParaHora(minutosTotais) {
    const h = Math.floor(minutosTotais / 60).toString().padStart(2, "0");
    const m = (minutosTotais % 60).toString().padStart(2, "0");
    return `${h}:${m}`;
}

function atualizarHorariosDisponiveis() {
    const dataSelecionada = document.getElementById("data").value;
    const selectHora = document.getElementById("hora");

    selectHora.innerHTML = "";

    if (!dataSelecionada) {
        selectHora.innerHTML = `<option value="" disabled selected>Selecione a data primeiro</option>`;
        return;
    }

    const optionPadrao = document.createElement("option");
    optionPadrao.value = "";
    optionPadrao.disabled = true;
    optionPadrao.selected = true;
    optionPadrao.textContent = "Selecione o horário";
    selectHora.appendChild(optionPadrao);

    const agendamentosDoDia = agendamentos.filter(item => item.data === dataSelecionada);

    for (let min = INICIO_EXPEDIENTE; min <= FIM_EXPEDIENTE - 60; min += INTERVALO_OPCOES) {
        const inicioNovo = min;
        const fimNovo = min + 60;

        const conflito = agendamentosDoDia.some(item => {
            const agendadoInicio = horaParaMinutos(item.hora);
            const agendadoFim = agendadoInicio + 60;
            return inicioNovo < agendadoFim && fimNovo > agendadoInicio;
        });

        const agora = new Date();
        const hojeStr = agora.toISOString().split("T")[0];
        let jaPassou = false;

        if (dataSelecionada === hojeStr) {
            const minutosAtuais = agora.getHours() * 60 + agora.getMinutes();
            if (min <= minutosAtuais) jaPassou = true;
        }

        if (!conflito && !jaPassou) {
            const opt = document.createElement("option");
            opt.value = minutosParaHora(min);
            opt.textContent = minutosParaHora(min);
            selectHora.appendChild(opt);
        }
    }

    if (selectHora.options.length === 1) {
        const optVazio = document.createElement("option");
        optVazio.disabled = true;
        optVazio.textContent = "Nenhum horário disponível";
        selectHora.appendChild(optVazio);
    }
}

// Controle de Acesso Restrito via Senha
function toggleAgenda() {
    const secaoAgenda = document.getElementById("secao-agenda");
    const btnVerificar = document.getElementById("btn-verificar");

    // Se já estiver visível, apenas oculta ao clicar novamente
    if (!secaoAgenda.classList.contains("oculto")) {
        secaoAgenda.classList.add("oculto");
        btnVerificar.textContent = "🔒 Área Administrativa";
        return;
    }

    // Solicita a senha ao usuário
    const senhaDigitada = prompt("Digite a senha de administrador para acessar:");

    if (senhaDigitada === SENHA_MESTRE) {
        secaoAgenda.classList.remove("oculto");
        btnVerificar.textContent = "🔓 Fechar Área Restrita";
    } else if (senhaDigitada !== null) {
        alert("Senha incorreta! Acesso negado.");
    }
}

function agendar() {
    const nome = document.getElementById("nome").value.trim();
    const servico = document.getElementById("servico").value;
    const data = document.getElementById("data").value;
    const hora = document.getElementById("hora").value;

    if (!nome || !servico || !data || !hora) {
        alert("Por favor, preencha todos os campos!");
        return;
    }

    const novoAgendamento = { nome, servico, data, hora };
    agendamentos.push(novoAgendamento);

    localStorage.setItem("agendamentos", JSON.stringify(agendamentos));
    
    atualizarListaUI();
    atualizarHorariosDisponiveis();

    const dataFormatada = data.split("-").reverse().join("/");
    const numeroWhatsapp = "5511948791705";
    const chavePix = "34385500835";

    const mensagem = `✨ *SOLICITAÇÃO DE AGENDAMENTO* ✨\n\n` +
                     `👤 *Cliente:* ${nome}\n` +
                     `💅 *Serviço:* ${servico}\n` +
                     `📅 *Data:* ${dataFormatada}\n` +
                     `⏰ *Horário:* ${hora}\n\n` +
                     `💵 *Sinal de Agendamento:* R$ 30,00\n` +
                     `🔑 *Chave Pix (CPF):* ${chavePix}\n\n` +
                     `📌 *Aviso:* Enviarei o comprovante do Pix de R$ 30,00 a seguir para confirmar meu agendamento. Estou ciente de que, em caso de não comparecimento no horário marcado, o valor não será ressarcido.`;

    const urlWhatsapp = `https://wa.me/${numeroWhatsapp}?text=${encodeURIComponent(mensagem)}`;

    document.getElementById("nome").value = "";
    document.getElementById("servico").value = "";
    document.getElementById("data").value = "";
    document.getElementById("hora").value = "";

    window.open(urlWhatsapp, "_blank");
}

function cancelarAgendamento(index) {
    if (confirm("Tem certeza que deseja cancelar este agendamento?")) {
        agendamentos.splice(index, 1);
        localStorage.setItem("agendamentos", JSON.stringify(agendamentos));
        
        atualizarListaUI();
        atualizarHorariosDisponiveis();
    }
}

function atualizarListaUI() {
    const lista = document.getElementById("lista-agendamento");
    lista.innerHTML = "";

    agendamentos.sort((a, b) => {
        if (a.data !== b.data) return a.data.localeCompare(b.data);
        return a.hora.localeCompare(b.hora);
    });

    if (agendamentos.length === 0) {
        lista.innerHTML = "<li>Nenhum horário reservado até o momento.</li>";
        return;
    }

    agendamentos.forEach((item, index) => {
        const li = document.createElement("li");
        const dataFormatada = item.data.split("-").reverse().join("/");

        li.innerHTML = `
            <div class="info-cliente">
                <strong>${item.nome}</strong>
                <span>✨ ${item.servico}</span>
                <small>📅 ${dataFormatada} às ⏰ ${item.hora}</small>
            </div>
            <button class="btn-cancelar" onclick="cancelarAgendamento(${index})">Cancelar</button>
        `;
        lista.appendChild(li);
    });
}