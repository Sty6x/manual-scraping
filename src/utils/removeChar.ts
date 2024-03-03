export default function removeChar(argument: string): string {
  let tmpHolder = "";
  for (let i = 0; i < argument.length; i++) {
    if (argument[i] !== "-") {
      tmpHolder += argument[i];
    } else {
      tmpHolder += " ";
    }
  }
  return tmpHolder;
}
