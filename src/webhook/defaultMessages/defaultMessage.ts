function validateMail(mail: string) {
    const mailPattern = /^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/;
    return mailPattern.test(mail);
}

export function sendMessage(message : string) : string {

    switch(message){
        case "firstmessage":
            return "Hola! Soy el agente virtual de la mesa de ayuda, te voy acompañar en la generación de un ticket." + '\n' +  
                    "Voy a necesitar que escribas tu correo electronico correspondiente a la empresa en donde trabajas" + '\n' + 
                    "Ejemplo: tucorreo@email.com" + '\n' +
                    "¡Ten en cuenta que validaremos el formato del mismo, asi que antes de enviarlo revisa bien tu correo!"

        case 'invalidated':
            return "El formato del correo electronico NO es valido, por favor vuelva a intentarlo."

        case 'validated&notverified':
            return "No se logro verificar su identidad, por favor vuelva intentarlo."

        case 'validated&verified':
            return "Identidad verificada" + '\n' +
                    "Genial, ahora te comparto una lista de opciones, decime el número que se ajuste tu problema." + '\n' +
                    "1 . Problemas con la cuenta o inicio de sesión." + '\n' +
                    "2 . Problemas con mi equipo de trabajo." + '\n' +
                    "3 . Problemas con de red." + '\n' +
                    "4 . Problemas con los sistemas de la organización."

        case 'groupoption': 
            return ""

        default: 
            return "No entiendo la opción que elegiste, por favor escribe -> hola <- para re-iniciar una conversación."
    }
}