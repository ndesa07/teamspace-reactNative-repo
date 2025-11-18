export const FN_URL = "https://69129d3f002b23f1769e.syd.appwrite.run/"; 
export default {}; 
export async function sendWelcomeEmail({ email, name, clubName, sortCode, SortCodeCaptain }) 
{ 
    const body = { email, name, clubName, sortCode,SortCodeCaptain }; 
    const response = await fetch(FN_URL, { method: "POST", headers: 
        { "Content-Type": "application/json" }, 
        body: JSON.stringify(body), });
         const json = await response.json(); 
         if (!response.ok || !json.success) 
        { 
            throw new Error(json.error || "Function call failed"); 

        } 
        return json; 
}