
export function sendMessage(message : string) : string {

    let result : string
    const selection : string[] = ["1", "2", "3", "4"]
    if(message.toLowerCase() === 'hola')result = message.toLowerCase().trim()
    if( message.toLowerCase().endsWith('_eden') || 
        message.toLowerCase().endsWith('_edesa') ||
        message.toLowerCase().endsWith('_edes') || 
        message.toLowerCase().endsWith('_edelap') || 
        message.toLowerCase().endsWith('_edea') || 
        message.toLowerCase().endsWith('_desa'))result = 'nombre_apellido_distribuidora'
    if(!isNaN(parseInt(message)) && selection.includes(message.toLowerCase())) result = 'opcion'
    if(message.toLowerCase().startsWith('problema:')) result = 'problema'

    switch(result){
        case 'hola':
            return "Hola! Soy el agente virtual de la mesa de ayuda, te voy acompañar en la generación de un ticket." + '\n' +  
                    "Voy hacerte unas pocas preguntas para comenzar." + '\n' + 
                    "¿Puedes decirme tu nombre, apellido y distribuidora de la cual te comunicas? Escribelo de la siguiente manera nombre_apellido_distribuidora, es importante que lo separes sólo con guiones."

        case 'nombre_apellido_distribuidora':
            return "Genial, ahora te comparto una lista de opciones, decime el número que se ajuste tu problema." + '\n' +
                    "1 . Problemas con la cuenta o inicio de sesión." + '\n' +
                    "2 . Problemas con mi equipo de trabajo." + '\n' +
                    "3 . Problemas con de red." + '\n' +
                    "4 . Problemas con los sistemas de la organización."

        case 'opcion':
            return "Para concluir te voy a solicitar que agregues una breve descripción del problema." + '\n' +
                    "Inicie el mensaje de la siguiente manera -> problema: Aquí va tu comentario."

        case 'problema': 
            return "Perfecto! Con esta información que me compartis voy a generar el ticket, en breve un técnico tomará tu caso y se pondrá en contacto." + '\n' + 
                    "Muchas gracias por ponerte en contacto, que tengas un lindo día."

        default: 
            return "No entiendo la opción que elegiste, por favor escribe -> hola <- para re-iniciar una conversación."

    }
}