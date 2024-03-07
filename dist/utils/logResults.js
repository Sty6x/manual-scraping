export default function logResults(state, data) {
    if (state === "Fail") {
        console.log("Something went wrong.");
        return;
    }
    console.log("Data Scheme:");
    console.log(data?.sampleSchema);
    console.log(`Successfully Scraped: ${data && data.arr.length} Items`);
}
