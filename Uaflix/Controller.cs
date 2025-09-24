using Shared.Models.Templates;
using Shared.Engine;
using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Web;
using System.Linq;
using HtmlAgilityPack;
using Shared;
using Shared.Models.Templates;
using System.Text.RegularExpressions;
using Shared.Models.Online.Settings;
using Shared.Models;
using Uaflix.Models;

namespace Uaflix.Controllers
{

    public class Controller : BaseOnlineController
    {
        ProxyManager proxyManager;

        public Controller()
        {
            proxyManager = new ProxyManager(ModInit.UaFlix);
        }
        
        [HttpGet]
        [Route("uaflix")]
        async public Task<ActionResult> Index(long id, string imdb_id, long kinopoisk_id, string title, string original_title, string original_language, int year, string source, int serial, string account_email, string t, int s = -1, int e = -1, bool play = false, bool rjson = false)
        {
            var init = await loadKit(ModInit.UaFlix);
            if (await IsBadInitialization(init))
                return Forbid();

            var invoke = new UaflixInvoke(init, hybridCache, OnLog, proxyManager);

            if (play)
            {
                var playResult = await invoke.ParseEpisode(t);
                if (playResult.streams != null && playResult.streams.Count > 0)
                    return Redirect(HostStreamProxy(init, accsArgs(playResult.streams.First().link)));

                return Content("Uaflix", "text/html; charset=utf-8");
            }

            if (serial == 1)
            {
                var paginationInfo = await invoke.GetPaginationInfo(imdb_id, kinopoisk_id, title, original_title, year);
                if (paginationInfo == null || paginationInfo.Episodes == null)
                    return Content("Uaflix", "text/html; charset=utf-8");

                if (s == -1) // Выбор сезона
                {
                    var seasons = paginationInfo.Episodes.Select(se => se.season).Distinct().OrderBy(se => se);
                    var season_tpl = new SeasonTpl(seasons.Count());
                    
                    foreach (var season in seasons)
                    {
                        string link = $"{host}/uaflix?imdb_id={imdb_id}&kinopoisk_id={kinopoisk_id}&title={HttpUtility.UrlEncode(title)}&original_title={HttpUtility.UrlEncode(original_title)}&year={year}&serial=1&s={season}";
                        season_tpl.Append($"Сезон {season}", link, $"{season}");
                    }
                    return rjson ? Content(season_tpl.ToJson(), "application/json; charset=utf-8") : Content(season_tpl.ToHtml(), "text/html; charset=utf-8");
                }
                else // Выбор эпизода
                {
                    var episodes = paginationInfo.Episodes.Where(ep => ep.season == s).OrderBy(ep => ep.episode).ToList();
                    var episode_tpl = new EpisodeTpl();
                    foreach(var ep in episodes)
                    {
                        string link = $"{host}/uaflix?t={HttpUtility.UrlEncode(ep.url)}&play=true";
                        episode_tpl.Append(ep.title, title, ep.season.ToString(), ep.episode.ToString(), accsArgs(link));
                    }
                    return rjson ? Content(episode_tpl.ToJson(), "application/json; charset=utf-8") : Content(episode_tpl.ToHtml(), "text/html; charset=utf-8");
                }
            }
            else // Фильм
            {
                var episodesInfo = await invoke.Search(imdb_id, kinopoisk_id, title, original_title, year, true);
                if (episodesInfo == null || episodesInfo.Count == 0)
                    return Content("Uaflix", "text/html; charset=utf-8");
                
                string link = $"{host}/uaflix?t={HttpUtility.UrlEncode(episodesInfo[0].url)}&play=true";
                var tpl = new MovieTpl(title, original_title, 1);
                tpl.Append(episodesInfo[0].title, accsArgs(link), method: "play");
                return rjson ? Content(tpl.ToJson(), "application/json; charset=utf-8") : Content(tpl.ToHtml(), "text/html; charset=utf-8");
            }
        }
    }
}
