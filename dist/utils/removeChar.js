export default function removeChar(argument) {
    let tmpHolder = "";
    for (let i = 0; i < argument.length; i++) {
        if (argument[i] !== "-") {
            tmpHolder += argument[i];
        }
        else if (argument[i] === "&") {
            tmpHolder += "&";
        }
        else {
            tmpHolder += " ";
        }
    }
    return tmpHolder;
}
