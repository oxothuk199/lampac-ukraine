using Shared.Models.Base;  
using System.Collections.Generic;  
   
namespace CikavaIdeya  
{  
    public class OnlineApi  
    {
        public static List<(string name, string url, string plugin, int index)> Events(string host, long id, string imdb_id, long kinopoisk_id, string title, string original_title, string original_language, int year, string source, int serial, string account_email)
        {
            var online = new List<(string name, string url, string plugin, int index)>();
 
            var init = ModInit.CikavaIdeya;
            if (init.enable && !init.rip)
            {
                string url = init.overridehost;
                if (string.IsNullOrEmpty(url))
                    url = $"{host}/cikavaideya";
 
                online.Add((init.displayname, url, "cikavaideya", init.displayindex));
            }
 
            return online;
        }
    }
}