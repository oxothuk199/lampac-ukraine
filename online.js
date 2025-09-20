(функция() {
  «использовать строго»;

  var Определено = {
    API: 'lampac',
    localhost: 'https://personal-goat-sahsgdkffk-848edc70.koyeb.app/',
    апн: ''
  };

  var balansers_with_search;
  
  var unic_id = Lampa.Storage.get('lampac_unic_id', '');
  если (!unic_id) {
    unic_id = Lampa.Utils.uid(8).toLowerCase();
    Lampa.Storage.set('lampac_unic_id', unic_id);
  }
  
  var hostkey = 'https://personal-goat-sahsgdkffk-848edc70.koyeb.app'.replace('http://', ​​'').replace('https://', ​​'');

  если (!window.rch || !window.rch[hostkey]) {
    Lampa.Utils.putScript(["https://personal-goat-sahsgdkffk-848edc70.koyeb.app/invc-rch.js"], function() {
      window.rch[hostkey].typeInvoke('https://personal-goat-sahsgdkffk-848edc70.koyeb.app', function() {});
    }, ложь, функция() {
      console.log('Lampac', 'ошибка загрузки invc-rch.js');
    }, истинный);
  }

  функция rchInvoke(json, вызов) {
    если (window.hubConnection && window.hubConnection[hostkey])
      window.hubConnection[hostkey].stop();

    если (!window.hubConnection)
      window.hubConnection = {};

    window.hubConnection[hostkey] = new signalR.HubConnectionBuilder().withUrl(json.ws).build();
    window.hubConnection[hostkey].start().then(function() {
      window.rch[hostkey].Registry(window.hubConnection[hostkey], function() {
        вызов();
      });
    })["catch"](function(err) {
      Lampa.Noty.show(err.toString());
    });
  }

  функция rchRun(json, вызов) {
    если (typeof signalR == 'undefined') {
      Lampa.Utils.putScript(["https://personal-goat-sahsgdkffk-848edc70.koyeb.app/signalr-6.0.25_es5.js"], function() {}, false, function() {
        rchInvoke(json, вызов);
      }, истинный);
    } еще {
      rchInvoke(json, вызов);
    }
  }
  
  функция аккаунт(url) {
    URL = URL + '';
    если (url.indexOf('account_email=') == -1) {
      var email = Lampa.Storage.get('account_email');
      если (email) url = Lampa.Utils.addUrlComponent(url, 'account_email=' + encodeURIComponent(email));
    }
    если (url.indexOf('uid=') == -1) {
      var uid = Lampa.Storage.get('lampac_unic_id', '');
      если (uid) url = Lampa.Utils.addUrlComponent(url, 'uid=' + encodeURIComponent(uid));
    }
    если (url.indexOf('token=') == -1) {
      var токен = '';
      если (токен != '') url = Lampa.Utils.addUrlComponent(url, 'токен=');
    }
    обратный URL;
  }
  
  var Network = Lampa.Reguest;

  компонент функции(объект) {
    var network = new Network();
    var прокрутка = новый Lampa.Scroll({
      маска: правда,
      более: правда
    });
    var files = new Lampa.Explorer(object);
    вар фильтр = новый Lampa.Filter(объект);
    var sources = {};
    var last;
    источник var;
    var balanser;
    var инициализирована;
    var balanser_timer;
    var images = [];
    var number_of_requests = 0;
    var number_of_requests_timer;
    var life_wait_times = 0;
    var life_wait_timer;
    var filter_sources = {};
    var filter_translate = {
      сезон: Lampa.Lang.translate('torrent_serial_season'),
      голос: Lampa.Lang.translate('torrent_parser_voice'),
      источник: Lampa.Lang.translate('settings_rest_source')
    };
    var filter_find = {
      сезон: [],
      голос: []
    };
	
    если (balansers_with_search == не определено) {
      сеть.таймаут(10000);
      сеть. тихий(аккаунт('https://personal-goat-sahsgdkffk-848edc70.koyeb.app/lite/withsearch'), функция(json) {
        balansers_with_search = json;
      }, функция() {
		  балансеры_с_поиском = [];
	  });
    }
	
    функция balanserName(j) {
      var bals = j.balanser;
      var name = j.name.split(' ')[0];
      return (bals || name).toLowerCase();
    }
	
	функция clarificationSearchAdd(значение){
		var id = Lampa.Utils.hash(object.movie.number_of_seasons ? object.movie.original_name : object.movie.original_title);
		var all = Lampa.Storage.get('clarification_search','{}');
		
		все[id] = значение;
		
		Lampa.Storage.set('clarification_search',all);
	}
	
	функция уточнениеSearchDelete(){
		var id = Lampa.Utils.hash(object.movie.number_of_seasons ? object.movie.original_name : object.movie.original_title);
		var all = Lampa.Storage.get('clarification_search','{}');
		
		удалить все[id];
		
		Lampa.Storage.set('clarification_search',all);
	}
	
	функция clarificationSearchGet(){
		var id = Lampa.Utils.hash(object.movie.number_of_seasons ? object.movie.original_name : object.movie.original_title);
		var all = Lampa.Storage.get('clarification_search','{}');
		
		вернуть все[id];
	}
	
    эта.инициализация = функция() {
      var _this = this;
      эта.загрузка(истина);
      фильтр.onSearch = функция(значение) {
		  
		уточнениеSearchAdd(значение);
		
        Lampa.Activity.replace({
          поиск: значение,
          уточнение: верно,
          похоже: правда
        });
      };
      фильтр.onBack = функция() {
        _this.start();
      };
      filter.render().find('.selector').on('hover:enter', function() {
        ClearInterval (balanser_timer);
      });
      filter.render().find('.filter--search').appendTo(filter.render().find('.torrent-filter'));
      фильтр.onSelect = функция(тип, а, б) {
        если (тип == 'фильтр') {
          если (a.reset) {
			  разъяснениеПоискУдалить();
			  
            _этот.заменитьВыбор({
              сезон: 0,
              голос: 0,
              voice_url: '',
              voice_name: ''
            });
            setTimeout(функция() {
              Lampa.Select.close();
              Lampa.Activity.replace({
				  уточнение: 0,
				  похожие: 0
			  });
            }, 10);
          } еще {
            var url = filter_find[a.stype][b.index].url;
            var выбор = _this.getChoice();
            если (a.stype == 'voice') {
              выбор.голосовое_имя = фильтр_найти.голос[b.индекс].название;
              выбор.голосовой_url = url;
            }
            выбор[a.stype] = b.index;
            _this.saveChoice(выбор);
            _this.reset();
            _этот.запрос(url);
            setTimeout(Lampa.Select.close, 10);
          }
        } иначе если (тип == 'сортировка') {
          Lampa.Select.close();
          объект.lampac_custom_select = a.source;
          _this.changeBalanser(a.source);
        }
      };
      если (фильтр.addButtonBack) фильтр.addButtonBack();
      filter.render().find('.filter--sort span').text(Lampa.Lang.translate('lampac_balanser'));
      scroll.body().addClass('torrent-list');
      файлы.appendFiles(scroll.render());
      files.appendHead(filter.render());
      scroll.minus(files.render().find('.explorer__files-head'));
      scroll.body().append(Lampa.Template.get('lampac_content_loading'));
      Lampa.Controller.enable('content');
      эта.загрузка(ложь);
	  если(объект.балансир){
		  files.render().find('.filter--search').remove();
		  источники = {};
		  источники[объект.балансир] = {имя: объект.балансир};
		  балансер = объект.балансер;
		  filter_sources = [];
		  
		  return network["native"](account(object.url.replace('rjson=','nojson=')), this.parse.bind(this), function(){
			  files.render().find('.torrent-filter').remove();
			  _это.пусто();
		  }, ЛОЖЬ, {
            Тип данных: «текст»
		  });
	  }
      this.externalids().then(function() {
        вернуть _this.createSource();
      }).then(function(json) {
        если (!balansers_with_search.find(function(b) {
            return balanser.slice(0, b.length) == b;
          })) {
          filter.render().find('.filter--search').addClass('hide');
        }
        _this.search();
      })["поймать"](функция(e) {
        _this.noConnectToServer(e);
      });
    };
    этот.rch = функция(json, noreset) {
      var _this2 = это;
	  rchRun(json, функция() {
        если (!noreset) _this2.find();
        иначе noreset();
	  });
    };
    this.externalids = function() {
      вернуть новое обещание (функция (разрешить, отклонить) {
        если (!object.movie.imdb_id || !object.movie.kinopoisk_id) {
          var query = [];
          query.push('id=' + object.movie.id);
          query.push('serial=' + (object.movie.name ? 1 : 0));
          если (object.movie.imdb_id) query.push('imdb_id=' + (object.movie.imdb_id || ''));
          если (object.movie.kinopoisk_id) query.push('kinopoisk_id=' + (object.movie.kinopoisk_id || ''));
          var url = Defined.localhost + 'externalids?' + query.join('&');
          сеть.таймаут(10000);
          сеть. тихий(учетная запись(url), функция(json) {
            для (имя переменной в json) {
              объект.movie[имя] = json[имя];
            }
            решать();
          }, функция() {
            решать();
          });
        } иначе разрешить();
      });
    };
    this.updateBalanser = function(balanser_name) {
      varlast_select_balanser = Lampa.Storage.cache('online_last_balanser', 3000, {});
      Last_select_balanser[object.movie.id] = имя_балансера;
      Lampa.Storage.set('online_last_balanser', Last_select_balanser);
    };
    этот.изменитьBalanser = функция(имя_балансира) {
      this.updateBalanser(имя_балансера);
      Lampa.Storage.set('online_balanser', balanser_name);
      var to = this.getChoice(balanser_name);
      var from = this.getChoice();
      если (from.voice_name) to.voice_name = from.voice_name;
      this.saveChoice(to, balanser_name);
      Lampa.Activity.replace();
    };
    этот.requestParams = функция(url) {
      var query = [];
      var card_source = object.movie.source || 'tmdb'; //Lampa.Storage.field('source')
      query.push('id=' + object.movie.id);
      если (object.movie.imdb_id) query.push('imdb_id=' + (object.movie.imdb_id || ''));
      если (object.movie.kinopoisk_id) query.push('kinopoisk_id=' + (object.movie.kinopoisk_id || ''));
      query.push('title=' + encodeURIComponent(object.clarification ? object.search : object.movie.title || object.movie.name));
      query.push('original_title=' + encodeURIComponent(object.movie.original_title || object.movie.original_name));
      query.push('serial=' + (object.movie.name ? 1 : 0));
      запрос.push('исходный_язык=' + (object.movie.исходный_язык || ''));
      query.push('year=' + ((object.movie.release_date || object.movie.first_air_date || '0000') + '').slice(0, 4));
      query.push('source=' + card_source);
	  query.push('rchtype=' + (window.rch[hostkey] ? window.rch[hostkey].type : ''));
      query.push('уточнение=' + (object.уточнение ? 1 : 0));
      query.push('similar=' + (object.similar ? true : false));
      если (Lampa.Storage.get('account_email', '')) query.push('cub_id=' + Lampa.Utils.hash(Lampa.Storage.get('account_email', '')));
      вернуть url + (url.indexOf('?') >= 0 ? '&' : '?') + query.join('&');
    };
    этот.getLastChoiceBalanser = функция() {
      varlast_select_balanser = Lampa.Storage.cache('online_last_balanser', 3000, {});
      если (last_select_balanser[object.movie.id]) {
        вернуть last_select_balanser[object.movie.id];
      } еще {
        return Lampa.Storage.get('online_balanser', filter_sources.length ? filter_sources[0] : '');
      }
    };
    этот.startSource = функция(json) {
      вернуть новое обещание (функция (разрешить, отклонить) {
        json.forEach(функция(j) {
          имя_вара = balanserName(j);
          источники[имя] = {
            URL: j.url,
            имя: j.name,
            показывать: тип j.show == 'undefined' ? правда : j.show
          };
        });
        filter_sources = Lampa.Arrays.getKeys(источники);
        если (filter_sources.length) {
          varlast_select_balanser = Lampa.Storage.cache('online_last_balanser', 3000, {});
          если (last_select_balanser[object.movie.id]) {
            balanser = Last_select_balanser[object.movie.id];
          } еще {
            balanser = Lampa.Storage.get('online_balanser', filter_sources[0]);
          }
          if (!sources[balanser]) balanser = filter_sources[0];
          если (!sources[balanser].show && !object.lampac_custom_select) balanser = filter_sources[0];
          источник = источники[балансировщик].url;
          разрешить(json);
        } еще {
          отклонять();
        }
      });
    };
    этот.источникжизни = функция() {
      var _this3 = это;
      вернуть новое обещание (функция (разрешить, отклонить) {
        var url = _this3.requestParams(Defined.localhost + 'lifeevents?memkey=' + (_this3.memkey || ''));
        var red = false;
        var gou = function gou(json, any) {
          если (json.accsdb) возвращает reject(json);
          вар Last_balanser = _this3.getLastChoiceBalanser();
          если (!красный) {
            var _filter = json.online.filter(function(c) {
              вернуть что-нибудь ? c.show : c.show && c.name.toLowerCase() == last_balanser;
            });
            если (_фильтр.длина) {
              красный = истина;
              разрешить(json.online.filter(function(c) {
                возврат c.show;
              }));
            } иначе если (любой) {
              отклонять();
            }
          }
        };
        вар плавник = функция плавник(вызов) {
          сеть.таймаут(3000);
          сеть. тихий(учетная запись(url), функция(json) {
            life_wait_times++;
            filter_sources = [];
            источники = {};
            json.online.forEach(функция(j) {
              имя_вара = balanserName(j);
              источники[имя] = {
                URL: j.url,
                имя: j.name,
                показывать: тип j.show == 'undefined' ? правда : j.show
              };
            });
            filter_sources = Lampa.Arrays.getKeys(источники);
            фильтр.набор('сортировка', фильтр_источников.карта(функция(e) {
              возвращаться {
                название: источники[e].имя,
                источник: е,
                выбрано: e == балансир,
                призрак: !sources[e].show
              };
            }));
            filter.chosen('sort', [sources[balanser] ? source[balanser].name : balanser]);
            gou(json);
            вар Lastb = _this3.getLastChoiceBalanser();
            если (life_wait_times > 15 || json.ready) {
              filter.render().find('.lampac-balanser-loader').remove();
              gou(json, true);
            } иначе если (!red && источники[lastb] && источники[lastb].show) {
              gou(json, true);
              life_wait_timer = setTimeout(fin, 1000);
            } еще {
              life_wait_timer = setTimeout(fin, 1000);
            }
          }, функция() {
            life_wait_times++;
            если (время_ожидания_жизни > 15) {
              отклонять();
            } еще {
              life_wait_timer = setTimeout(fin, 1000);
            }
          });
        };
        плавник();
      });
    };
    this.createSource = function() {
      var _this4 = это;
      вернуть новое обещание (функция (разрешить, отклонить) {
        var url = _this4.requestParams(Defined.localhost + 'lite/events?life=true');
        сеть.таймаут(15000);
        сеть. тихий(учетная запись(url), функция(json) {
          если (json.accsdb) возвращает reject(json);
          если (json.life) {
			_this4.memkey = json.memkey;
			если (json.title) {
              если (object.movie.name) object.movie.name = json.title;
              если (object.movie.title) object.movie.title = json.title;
			}
            filter.render().find('.filter--sort').append('<span class="lampac-balanser-loader" style="width: 1.2em; height: 1.2em; margin-top: 0; background: url(./img/loader.svg) no-repeat 50% 50%; background-size: contain; margin-left: 0.5em"></span>');
            _this4.lifeSource().then(_this4.startSource).then(resolve)["catch"](reject);
          } еще {
            _this4.startSource(json).then(resolve)["catch"](reject);
          }
        }, отклонять);
      });
    };
    /**
     * Подготовка
     */
    это.создать = функция() {
      вернуть this.render();
    };
    /**
     * Начать поиск
     */
    этот.поиск = функция() { //это.загрузка(истина)
      этот.фильтр({
        источник: filter_sources
      }, this.getChoice());
      это.найти();
    };
    этот.найти = функция() {
      этот.запрос(этот.параметрызапроса(источник));
    };
    этот.запрос = функция(url) {
      количество_запросов++;
      если (число_запросов < 10) {
        сеть["родной"](учетная запись(url), этот.parse.bind(это), этот.doesNotAnswer.bind(это), ложь, {
          Тип данных: «текст»
        });
        clearTimeout(число_запросов_таймер);
        количество_запросов_таймер = setTimeout(function() {
          количество_запросов = 0;
        }, 4000);
      } иначе this.empty();
    };
    this.parseJsonDate = функция(str, name) {
      пытаться {
        var html = $('<div>' + str + '</div>');
        var elems = [];
        html.find(имя).each(функция() {
          var item = $(это);
          var data = JSON.parse(item.attr('data-json'));
          var season = item.attr('s');
          var episode = item.attr('e');
          var text = item.text();
          если (!object.movie.name) {
            если (текст.соответствие(/\d+p/i)) {
              если (!data.quality) {
                качество данных = {};
                data.quality[текст] = data.url;
              }
              текст = объект.фильм.название;
            }
            if (text == 'По умолчанию') {
              текст = объект.фильм.название;
            }
          }
          если (эпизод) данные.эпизод = parseInt(эпизод);
          если (сезон) data.season = parseInt(сезон);
          если (текст) данные.текст = текст;
          data.active = item.hasClass('active');
          elems.push(данные);
        });
        возврат элементов;
      } поймать (е) {
        возвращаться [];
      }
    };
    this.getFileUrl = функция(файл, вызов) {
	  var _this = this;
	  
      если (Lampa.Storage.field('player') !== 'inner' && file.stream && Lampa.Platform.is('apple')) {
		  var newfile = Lampa.Arrays.clone(файл);
		  новыйфайл.метод = 'воспроизведение';
		  новыйфайл.url = файл.поток;
		  вызов(новыйфайл, {});
	  }
      иначе если (файл.метод == 'воспроизведение') вызов(файл, {});
      еще {
        Lampa.Loading.start(function() {
          Lampa.Loading.stop();
          Lampa.Controller.toggle('content');
          сеть.очистить();
        });
        сеть["нативный"](аккаунт(файл.url), функция(json) {
			если(json.rch){
				_это.rch(json,функция(){
					Lampa.Loading.stop();
					
					_this.getFileUrl(файл, вызов);
				});
			}
			еще{
				Lampa.Loading.stop();
				вызов(json, json);
			}
        }, функция() {
          Lampa.Loading.stop();
          вызов(ложь, {});
        });
      }
    };
    этот.toPlayElement = функция(файл) {
      var play = {
        название: file.title,
        URL: file.url,
        качество: file.qualitys,
        временная шкала: файл.временная шкала,
        субтитры: file.subtitles,
        обратный вызов: file.mark
      };
      ответная игра;
    };
    этот.orUrlReserve = функция(данные) {
      если (data.url && typeof data.url == 'string' && data.url.indexOf(" или ") !== -1) {
        var urls = data.url.split(" или ");
        данные.url = urls[0];
        data.url_reserve = urls[1];
      }
    };
    this.setDefaultQuality = функция(данные) {
      если (Lampa.Arrays.getKeys(data.quality).length) {
        для (var q в data.quality) {
          если (parseInt(q) == Lampa.Storage.field('video_quality_default')) {
            data.url = data.quality[q];
            this.orUrlReserve(данные);
          }
          если (data.quality[q].indexOf(" или ") !== -1)
            data.quality[q] = data.quality[q].split(" или ")[0];
        }
      }
    };
    this.display = function(videos) {
      var _this5 = это;
      это.рисовать(видео, {
        onEnter: функция onEnter(item, html) {
          _this5.getFileUrl(элемент, функция(json, json_call) {
            если (json && json.url) {
              var playlist = [];
              var first = _this5.toPlayElement(item);
              первый.url = json.url;
              first.headers = json_call.headers || json.headers;
              first.quality = json_call.quality || item.qualitys;
              first.hls_manifest_timeout = json_call.hls_manifest_timeout || json.hls_manifest_timeout;
              first.subtitles = json.subtitles;
			  если (json.vast) {
                first.vast_url = json.vast.url;
                first.vast_msg = json.vast.msg;
                первый.vast_регион = json.vast.регион;
                first.vast_platform = json.vast.platform;
                первый.vast_экран = json.vast.экран;
			  }
              _this5.orUrlReserve(первый);
              _this5.setDefaultQuality(первый);
              если (предмет.сезон) {
                видео.forEach(функция(элемент) {
                  var cell = _this5.toPlayElement(elem);
                  если (elem == item) cell.url = json.url;
                  еще {
                    если (элемент.метод == 'вызов') {
                      если (Lampa.Storage.field('player') !== 'inner') {
                        cell.url = elem.stream;
						удалить ячейку.качество;
                      } еще {
                        ячейка.url = функция(вызов) {
                          _this5.getFileUrl(elem, function(stream, stream_json) {
                            если (stream.url) {
                              ячейка.url = поток.url;
                              cell.quality = stream_json.quality || elem.qualitys;
                              ячейка.субтитры = поток.субтитры;
                              _this5.orUrlReserve(ячейка);
                              _this5.setDefaultQuality(ячейка);
                              элемент.марк();
                            } еще {
                              ячейка.url = '';
                              Lampa.Noty.show(Lampa.Lang.translate('lampac_nolink'));
                            }
                            вызов();
                          }, функция() {
                            ячейка.url = '';
                            вызов();
                          });
                        };
                      }
                    } еще {
                      ячейка.url = элемент.url;
                    }
                  }
                  _this5.orUrlReserve(ячейка);
                  _this5.setDefaultQuality(ячейка);
                  playlist.push(ячейка);
                }); //Lampa.Player.playlist(плейлист)
              } еще {
                playlist.push(первый);
              }
              если (playlist.length > 1) первый.плейлист = плейлист;
              если (первый.url) {
                переменная элемент = первый;
				элемент.isonline = правда;
                если (элемент.url && элемент.isonline) {
  // online.js
}
иначе если (элемент.url) {
  если (ложь) {
    если (Platform.is('browser') && location.host.indexOf("127.0.0.1") !== -1) {
      Noty.show('Видео открыто в playerInner', {time: 3000});
      $.get('https://personal-goat-sahsgdkffk-848edc70.koyeb.app/player-inner/' + element.url);
      возвращаться;
    }

    Player.play(элемент);
  }
  еще {
    если (Platform.is('browser') && location.host.indexOf("127.0.0.1") !== -1)
      Noty.show('Внешний плеер можно указать в init.conf (playerInner)', {time: 3000});
    Player.play(элемент);
  }
}
                Lampa.Player.play(элемент);
                Lampa.Player.playlist(плейлист);
                item.mark();
                _this5.updateBalanser(балансир);
              } еще {
                Lampa.Noty.show(Lampa.Lang.translate('lampac_nolink'));
              }
            } else Lampa.Noty.show(Lampa.Lang.translate('lampac_nolink'));
          }, истинный);
        },
        onContextMenu: функция onContextMenu(пункт, HTML, данные, вызов) {
          _this5.getFileUrl(элемент, функция(поток) {
            вызов({
              файл: stream.url,
              качество: item.qualitys
            });
          }, истинный);
        }
      });
      этот.фильтр({
        сезон: filter_find.season.map(function(s) {
          вернуть s.title;
        }),
        голос: filter_find.voice.map(function(b) {
          вернуть b.title;
        })
      }, this.getChoice());
    };
    этот.анализ = функция(str) {
      var json = Lampa.Arrays.decodeJson(str, {});
      если (Lampa.Arrays.isObject(str) && str.rch) json = str;
      если (json.rch) вернуть этот.rch(json);
      пытаться {
        var items = this.parseJsonDate(str, '.videos__item');
        var buttons = this.parseJsonDate(str, '.videos__button');
        если (items.length == 1 && items[0].method == 'link' && !items[0].similar) {
          filter_find.season = items.map(function(s) {
            возвращаться {
              заголовок: s.text,
              URL-адрес: s.url
            };
          });
          этот.replaceChoice({
            сезон: 0
          });
          этот.запрос(элементы[0].url);
        } еще {
          this.activity.loader(false);
          var videos = items.filter(function(v) {
            возврат v.method == 'воспроизведение' || v.method == 'вызов';
          });
          var similar = items.filter(function(v) {
            возврат v.similar;
          });
          если (видео.длина) {
            если (кнопки.длина) {
              filter_find.voice = buttons.map(function(b) {
                возвращаться {
                  заголовок: b.text,
                  URL-адрес: b.url
                };
              });
              var select_voice_url = this.getChoice(balanser).voice_url;
              var select_voice_name = this.getChoice(balanser).voice_name;
              var find_voice_url = buttons.find(function(v) {
                return v.url == select_voice_url;
              });
              var find_voice_name = buttons.find(function(v) {
                return v.text == select_voice_name;
              });
              var find_voice_active = buttons.find(function(v) {
                возврат v.active;
              }); ////console.log('b',buttons)
              ////console.log('u',find_voice_url)
              ////console.log('n',find_voice_name)
              ////console.log('a',find_voice_active)
              если (find_voice_url && !find_voice_url.active) {
                //console.log('Lampac', 'перейти к голосу', find_voice_url);
                этот.replaceChoice({
                  голос: buttons.indexOf(find_voice_url),
                  voice_name: find_voice_url.text
                });
                этот.запрос(find_voice_url.url);
              } иначе если (find_voice_name && !find_voice_name.active) {
                //console.log('Lampac', 'перейти к голосу', find_voice_name);
                этот.replaceChoice({
                  голос: buttons.indexOf(find_voice_name),
                  voice_name: find_voice_name.text
                });
                этот.запрос(find_voice_name.url);
              } еще {
                если (find_voice_active) {
                  этот.replaceChoice({
                    голос: buttons.indexOf(find_voice_active),
                    voice_name: find_voice_active.text
                  });
                }
                this.display(видео);
              }
            } еще {
              этот.replaceChoice({
                голос: 0,
                voice_url: '',
                voice_name: ''
              });
              this.display(видео);
            }
          } иначе если (items.length) {
            если (похожая.длина) {
              это.подобные(подобные);
              this.activity.loader(false);
            } else { //this.activity.loader(true)
              filter_find.season = items.map(function(s) {
                возвращаться {
                  заголовок: s.text,
                  URL-адрес: s.url
                };
              });
              var select_season = this.getChoice(balanser).season;
              var season = filter_find.season[select_season];
              если (!сезон) сезон = фильтр_найти.сезон[0];
              //console.log('Lampac', 'перейти к сезону', сезон);
              этот.запрос(сезон.url);
            }
          } еще {
            этот.doesNotAnswer(json);
          }
        }
      } поймать (е) {
        //console.log('Lampac', 'error', e.stack);
        это.неОтвет(e);
      }
    };
    это.подобные = функция(json) {
      var _this6 = это;
      прокрутить.очистить();
      json.forEach(функция(элемент) {
        elem.title = elem.text;
        elem.info = '';
        var info = [];
        var year = ((elem.start_date || elem.year || object.movie.release_date || object.movie.first_air_date || '') + '').slice(0, 4);
        если (год) info.push(год);
        если (элемент.детали) info.push(элемент.детали);
        var name = elem.title || элемент.текст;
        elem.title = имя;
        элем.время = элем.время || '';
        elem.info = info.join('<span class="online-prestige-split">●</span>');
        var item = Lampa.Template.get('lampac_prestige_folder', elem);
		если (elem.img) {
		  var image = $('<img style="height: 7em; width: 7em; border-radius: 0.3em;"/>');
		  item.find('.online-prestige__folder').empty().append(image);

		  если (elem.img !== не определено) {
		    если (elem.img.charAt(0) === '/')
		      elem.img = Defined.localhost + elem.img.substring(1);
		    если (elem.img.indexOf('/proxyimg') !== -1)
		      элемент.img = аккаунт(элемент.img);
		  }

		  Lampa.Utils.imgLoad(изображение, элемент.img);
		}
        item.on('hover:enter', function() {
          _this6.reset();
          _this6.request(elem.url);
        }).on('hover:focus', function(e) {
          последний = e.target;
          scroll.update($(e.target), true);
        });
        scroll.append(элемент);
      });
	  этот.фильтр({
        сезон: filter_find.season.map(function(s) {
          вернуть s.title;
        }),
        голос: filter_find.voice.map(function(b) {
          вернуть b.title;
        })
      }, this.getChoice());
      Lampa.Controller.enable('content');
    };
    this.getChoice = function(for_balanser) {
      var data = Lampa.Storage.cache('online_choice_' + (for_balanser || balanser), 3000, {});
      var save = data[object.movie.id] || {};
      Lampa.Arrays.extend(save, {
        сезон: 0,
        голос: 0,
        voice_name: '',
        voice_id: 0,
        episodes_view: {},
        movie_view: ''
      });
      вернуть сохранение;
    };
    этот.saveChoice = функция(выбор, for_balanser) {
      var data = Lampa.Storage.cache('online_choice_' + (for_balanser || balanser), 3000, {});
      данные[объект.фильм.ид] = выбор;
      Lampa.Storage.set('online_choice_' + (for_balanser || балансировщик), данные);
      this.updateBalanser(for_balanser || balanser);
    };
    этот.replaceChoice = функция(выбор, for_balanser) {
      вар = this.getChoice(for_balanser);
      Lampa.Arrays.extend(to, choice, true);
      this.saveChoice(to, for_balanser);
    };
    this.clearImages = function() {
      изображения.forEach(функция(img) {
        img.onerror = function() {};
        img.onload = function() {};
        img.src = '';
      });
      изображения = [];
    };
    /**
     * Очистить список файлов.
     */
    этот.сброс = функция() {
      последний = ложь;
      ClearInterval (balanser_timer);
      сеть.очистить();
      this.clearImages();
      scroll.render().find('.empty').remove();
      прокрутить.очистить();
      прокрутить.сбросить();
      scroll.body().append(Lampa.Template.get('lampac_content_loading'));
    };
    /**
     * Загрузка
     */
    эта.загрузка = функция(статус) {
      если (статус) this.activity.loader(истина);
      еще {
        this.activity.loader(false);
        эта.активность.переключить();
      }
    };
    /**
     * Создать фильтр
     */
    этот.фильтр = функция(элементы_фильтра, выбор) {
      var _this7 = это;
      var select = [];
      var add = function add(type, title) {
        var need = _this7.getChoice();
        var items = filter_items[тип];
        var subitems = [];
        значение переменной = потребность[тип];
        items.forEach(функция(имя, i) {
          подэлементы.push({
            титул: имя,
            выбрано: значение == i,
            индекс: я
          });
        });
        выберите.push({
          название: название,
          подзаголовок: элементы[значение],
          элементы: подэлементы,
          тип: тип
        });
      };
      filter_items.source = filter_sources;
      выберите.push({
        title: Lampa.Lang.translate('torrent_parser_reset'),
        сброс: правда
      });
      this.saveChoice(выбор);
      если (filter_items.voice && filter_items.voice.length) add('voice', Lampa.Lang.translate('torrent_parser_voice'));
      если (filter_items.season && filter_items.season.length) add('season', Lampa.Lang.translate('torrent_serial_season'));
      фильтр.set('фильтр', выбор);
      фильтр.набор('сортировка', фильтр_источников.карта(функция(e) {
        возвращаться {
          название: источники[e].имя,
          источник: е,
          выбрано: e == балансир,
          призрак: !sources[e].show
        };
      }));
      это.выбрано(элементы_фильтра);
    };
    /**
     * Показать, что выбрано в фильтре
     */
    это.выбрано = функция(filter_items) {
      var need = this.getChoice(),
        выберите = [];
      для (var i в нужде) {
        если (filter_items[i] && filter_items[i].length) {
          если (i == 'голос') {
            выберите.push(filter_translate[i] + ': ' + filter_items[i][need[i]]);
          } иначе если (i !== 'источник') {
            если (filter_items.season.length >= 1) {
              выберите.push(filter_translate.season + ': ' + filter_items[i][need[i]]);
            }
          }
        }
      }
      фильтр.выбранный('фильтр', выбор);
      фильтр. selected('sort', [sources[balanser].name]);
    };
    this.getEpisodes = функция(сезон, вызов) {
      var episodes = [];
      если (['cub', 'tmdb'].indexOf(object.movie.source || 'tmdb') == -1) вернуть вызов(эпизоды);
      если (тип_объекта.фильм.идентификатор == 'номер' && объект.фильм.имя) {
        var tmdburl = 'tv/' + object.movie.id + '/season/' + season + '?api_key=' + Lampa.TMDB.key() + '&language=' + Lampa.Storage.get('language', 'ru');
        вар baseurl = Lampa.TMDB.api(tmdburl);
        сеть.таймаут(1000 * 10);
        сеть["родная"](baseurl, функция(данные) {
          эпизоды = данные.эпизоды || [];
          вызов(эпизоды);
        }, функция(а, с) {
          вызов(эпизоды);
        });
      } иначе вызов(эпизоды);
    };
    это.наблюдаемое = функция(набор) {
      var file_id = Lampa.Utils.hash(object.movie.number_of_seasons ? object.movie.original_name : object.movie.original_title);
      var observed = Lampa.Storage.cache('online_watched_last', 5000, {});
      если (установить) {
        если (!наблюдаемый[файл_id]) наблюдаемый[файл_id] = {};
        Lampa.Arrays.extend(наблюдаемый[файл_id], набор, правда);
        Lampa.Storage.set('online_watched_last', watching);
        this.updateWatched();
      } еще {
        вернуть отслеживаемый[file_id];
      }
    };
    this.updateWatched = function() {
      var observed = this.watched();
      var body = scroll.body().find('.online-prestige-watched .online-prestige-watched__body').empty();
      если (смотрел) {
        var line = [];
        если (наблюдаемый.имя_балансира) линия.push(наблюдаемый.имя_балансира);
        если (наблюдаемое.имя_голоса) строка.push(наблюдаемое.имя_голоса);
        если (просмотренный.сезон) строка.push(Lampa.Lang.translate('torrent_serial_season') + ' ' + просмотренный.сезон);
        если (просмотренный.эпизод) строка.толкнуть(Lampa.Lang.translate('torrent_serial_episode') + ' ' + просмотренный.эпизод);
        строка.forEach(функция(n) {
          тело.append('<span>' + n + '</span>');
        });
      } else body.append('<span>' + Lampa.Lang.translate('lampac_no_watch_history') + '</span>');
    };
    /**
     * Отрисовка файлов
     */
    this.draw = function(items) {
      var _this8 = это;
      var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      если (!items.length) вернуть this.empty();
      прокрутить.очистить();
      если (!object.balanser)scroll.append(Lampa.Template.get('lampac_prestige_watched', {}));
      this.updateWatched();
      этот.получитьЭпизоды(элементы[0].сезон, функция(эпизоды) {
        var viewed = Lampa.Storage.cache('online_view', 5000, []);
        вар серийный = объект.фильм.имя? правда: ложь;
        var choice = _this8.getChoice();
        var полностью = window.innerWidth > 480;
        var scroll_to_element = false;
        var scroll_to_mark = false;
        items.forEach(функция(элемент, индекс) {
          var episode = serial && episodes.length && !params.similars ? episodes.find(function(e) {
            вернуть e.episode_number == element.episode;
          }) : ЛОЖЬ;
          var episode_num = element.episode || index + 1;
          var episode_last = choice.episodes_view[element.season];
          var voice_name = choice.voice_name || (filter_find.voice[0] ? filter_find.voice[0].title: false) || element.voice_name || (сериал? 'Неизвестно': element.text) || «Неизвестно»;
          если (элемент.качество) {
            элемент.качества = элемент.качество;
            элемент.качество = Lampa.Arrays.getKeys(элемент.качество)[0];
          }
          Lampa.Arrays.extend(элемент, {
            имя_голоса: имя_голоса,
            информация: voice_name.length > 60 ? voice_name.substr(0, 60) + '...' : voice_name,
            качество: '',
            время: Lampa.Utils.secondsToTime((эпизод ? время.выполнения.эпизода : объект.фильм.время.выполнения) * 60, правда)
          });
          var hash_timeline = Lampa.Utils.hash(элемент.сезон ? [элемент.сезон, элемент.сезон > 10 ? ':' : '', элемент.эпизод, объект.фильм.оригинальное_название].join('') : объект.фильм.оригинальное_название);
          var hash_behold = Lampa.Utils.hash(элемент.сезон ? [элемент.сезон, элемент.сезон > 10 ? ':' : '', элемент.эпизод, объект.фильм.оригинальное_название, элемент.голосовое_название].join('') : объект.фильм.оригинальное_название + элемент.голосовое_название);
          переменные данные = {
            hash_timeline: hash_timeline,
            hash_behold: hash_behold
          };
          var info = [];
          если (элемент.сезон) {
            элемент.translate_episode_end = _this8.getLastEpisode(items);
            элемент.translate_voice = элемент.voice_name;
          }
          если (элемент.текст && !эпизод) элемент.название = элемент.текст;
          элемент.timeline = Lampa.Timeline.view(hash_timeline);
          если (эпизод) {
            элемент.название = название.эпизода;
            если (element.info.length < 30 && episode.vote_average) info.push(Lampa.Template.get('lampac_prestige_rate', {
              оценка: parseFloat(episode.vote_average + '').toFixed(1)
            }, истинный));
            если (episode.air_date && полностью) info.push(Lampa.Utils.parseTime(episode.air_date).full);
          } иначе если (object.movie.release_date && полностью) {
            info.push(Lampa.Utils.parseTime(object.movie.release_date).full);
          }
          если (!серийный && объект.фильм.теглайн && элемент.информация.длина < 30) информация.толкнуть(объект.фильм.теглайн);
          если (элемент.info) info.push(элемент.info);
          если (info.length) element.info = info.map(function(i) {
            вернуть '<span>' + i + '</span>';
          }).join('<span class="online-prestige-split">●</span>');
          var html = Lampa.Template.get('lampac_prestige_full', element);
          var loader = html.find('.online-prestige__loader');
          var image = html.find('.online-prestige__img');
		  если(object.balanser) изображение.скрыть();
          если (!серийный) {
            если (choice.movie_view == hash_behold) scroll_to_element = html;
          } иначе если (typeof episode_last !== 'undefined' && episode_last == episode_num) {
            scroll_to_element = html;
          }
          если (сериал && !эпизод) {
            image.append('<div class="online-prestige__episode-number">' + ('0' + (element.episode || index + 1)).slice(-2) + '</div>');
            загрузчик.remove();
          } иначе если (!serial && ['cub', 'tmdb'].indexOf(object.movie.source || 'tmdb') == -1) loader.remove();
          еще {
            var img = html.find('img')[0];
            img.onerror = function() {
              img.src = './img/img_broken.svg';
            };
            img.onload = function() {
              image.addClass('online-prestige__img--loaded');
              загрузчик.remove();
              если (сериал) изображение.append('<div class="online-prestige__episode-number">' + ('0' + (element.episode || index + 1)).slice(-2) + '</div>');
            };
            img.src = Lampa.TMDB.image('t/p/w300' + (episode ? episode.still_path : object.movie.backdrop_path));
            изображения.push(img);
          }
          html.find('.online-prestige__timeline').append(Lampa.Timeline.render(element.timeline));
          если (viewed.indexOf(hash_behold) !== -1) {
            scroll_to_mark = html;
            html.find('.online-prestige__img').append('<div class="online-prestige__viewed">' + Lampa.Template.get('icon_viewed', {}, true) + '</div>');
          }
          элемент.метка = функция() {
            просмотрено = Lampa.Storage.cache('online_view', 5000, []);
            если (viewed.indexOf(hash_behold) == -1) {
              просмотрено.push(hash_behold);
              Lampa.Storage.set('online_view', просмотрено);
              если (html.find('.online-prestige__viewed').length == 0) {
                html.find('.online-prestige__img').append('<div class="online-prestige__viewed">' + Lampa.Template.get('icon_viewed', {}, true) + '</div>');
              }
            }
            выбор = _this8.getChoice();
            если (!серийный) {
              выбор.movie_view = hash_behold;
            } еще {
              выбор.episodes_view[элемент.сезон] = номер_эпизода;
            }
            _this8.saveChoice(выбор);
            var voice_name_text = выбор.voice_name || элемент.voice_name || элемент.title;
            если (voice_name_text.length > 30) voice_name_text = voice_name_text.slice(0, 30) + '...';
            _this8.watched({
              балансир: балансир,
              balanser_name: Lampa.Utils.capitalizeFirstLetter(sources[balanser] ?sources[balanser].name.split(' ')[0] : balanser),
              voice_id: выбор.voice_id,
              voice_name: voice_name_text,
              эпизод: элемент.эпизод,
              сезон: элемент.сезон
            });
          };
          элемент.снять пометку = функция() {
            просмотрено = Lampa.Storage.cache('online_view', 5000, []);
            если (viewed.indexOf(hash_behold) !== -1) {
              Lampa.Arrays.remove(просмотрено, hash_behold);
              Lampa.Storage.set('online_view', просмотрено);
              Lampa.Storage.remove('online_view', hash_behold);
              html.find('.online-prestige__viewed').remove();
            }
          };
          элемент.timeclear = функция() {
            элемент.timeline.percent = 0;
            элемент.timeline.time = 0;
            элемент.timeline.duration = 0;
            Lampa.Timeline.update(элемент.timeline);
          };
          html.on('hover:enter', function() {
            если (object.movie.id) Lampa.Favorite.add('history', object.movie, 100);
            если (параметры.onEnter) параметры.onEnter(элемент, html, данные);
          }).on('hover:focus', function(e) {
            последний = e.target;
            если (параметры.onFocus) параметры.onFocus(элемент, html, данные);
            scroll.update($(e.target), true);
          });
          если (params.onRender) params.onRender(элемент, html, данные);
          _this8.contextMenu({
            html: html,
            элемент: элемент,
            onFile: функция onFile(вызов) {
              if (params.onContextMenu) params.onContextMenu(элемент, HTML, данные, вызов);
            },
            onClearAllMark: функция onClearAllMark() {
              items.forEach(функция(элемент) {
                elem.снять отметку();
              });
            },
            onClearAllTime: функция onClearAllTime() {
              items.forEach(функция(элемент) {
                elem.timeclear();
              });
            }
          });
          scroll.append(html);
        });
        если (сериал && эпизоды.длина > элементы.длина && !параметры.подобные) {
          var left = episodes.slice(items.length);
          left.forEach(функция(эпизод) {
            var info = [];
            если (episode.vote_average) info.push(Lampa.Template.get('lampac_prestige_rate', {
              оценка: parseFloat(episode.vote_average + '').toFixed(1)
            }, истинный));
            если (episode.air_date) info.push(Lampa.Utils.parseTime(episode.air_date).full);
            var air = new Date((episode.air_date + '').replace(/-/g, '/'));
            var now = Дата.now();
            var day = Math.round((air.getTime() - now) / (24 * 60 * 60 * 1000));
            var txt = Lampa.Lang.translate('full_episode_days_left') + ': ' + день;
            var html = Lampa.Template.get('lampac_prestige_full', {
              время: Lampa.Utils.secondsToTime((эпизод ? время выполнения эпизода : объект.фильм. время выполнения) * 60, правда),
              информация: info.length ? info.map(function(i) {
                вернуть '<span>' + i + '</span>';
              }).join('<span class="online-prestige-split">●</span>') : '',
              название: episode.name,
              качество: день > 0 ? txt : ''
            });
            var loader = html.find('.online-prestige__loader');
            var image = html.find('.online-prestige__img');
            var season = items[0] ? items[0].season : 1;
            html.find('.online-prestige__timeline').append(Lampa.Timeline.render(Lampa.Timeline.view(Lampa.Utils.hash([сезон, эпизод.номер_эпизода, объект.фильм.оригинальное_название].join('')))));
            var img = html.find('img')[0];
            если (episode.still_path) {
              img.onerror = function() {
                img.src = './img/img_broken.svg';
              };
              img.onload = function() {
                image.addClass('online-prestige__img--loaded');
                загрузчик.remove();
                image.append('<div class="online-prestige__episode-number">' + ('0' + episode.episode_number).slice(-2) + '</div>');
              };
              img.src = Lampa.TMDB.image('t/p/w300' + episode.still_path);
              изображения.push(img);
            } еще {
              загрузчик.remove();
              image.append('<div class="online-prestige__episode-number">' + ('0' + episode.episode_number).slice(-2) + '</div>');
            }
            html.on('hover:focus', function(e) {
              последний = e.target;
              scroll.update($(e.target), true);
            });
            html.css('непрозрачность', '0.5');
            scroll.append(html);
          });
        }
        если (прокрутить_до_элемента) {
          последний = scroll_to_element[0];
        } иначе если (прокрутить до отметки) {
          последний = scroll_to_mark[0];
        }
        Lampa.Controller.enable('content');
      });
    };
    /**
     * Меню
     */
    это.контекстноеменю = функция(параметры) {
      params.html.on('hover:long', function() {
        функция показать(дополнительно) {
          var enabled = Lampa.Controller.enabled().name;
          var menu = [];
          если (Lampa.Platform.is('webos')) {
            меню.push({
              title: Lampa.Lang.translate('player_lauch') + ' - Webos',
              игрок: 'webos'
            });
          }
          если (Lampa.Platform.is('android')) {
            меню.push({
              title: Lampa.Lang.translate('player_lauch') + ' - Android',
              плеер: 'андроид'
            });
          }
          меню.push({
            title: Lampa.Lang.translate('player_lauch') + ' - Лампа',
            игрок: 'lampa'
          });
          меню.push({
            заголовок: Lampa.Lang.translate('lampac_video'),
            разделитель: истина
          });
          меню.push({
            title: Lampa.Lang.translate('torrent_parser_label_title'),
            отметка: верная
          });
          меню.push({
            title: Lampa.Lang.translate('torrent_parser_label_cancel_title'),
            снять отметку: правда
          });
          меню.push({
            title: Lampa.Lang.translate('time_reset'),
            timeclear: правда
          });
          если (дополнительно) {
            меню.push({
              заголовок: Lampa.Lang.translate('copy_link'),
              копировать ссылку: правда
            });
          }
          если (window.lampac_online_context_menu)
            window.lampac_online_context_menu.push(меню, доп., параметры);
          меню.push({
            заголовок: Lampa.Lang.translate('еще'),
            разделитель: истина
          });
          если (Lampa.Account.logged() && параметры.элемент && тип параметров.элемент.сезон !== 'не определено' && параметры.элемент.translate_voice) {
            меню.push({
              title: Lampa.Lang.translate('lampac_voice_subscribe'),
              подписаться: правда
            });
          }
          меню.push({
            title: Lampa.Lang.translate('lampac_clear_all_marks'),
            clearallmark: true
          });
          меню.push({
            title: Lampa.Lang.translate('lampac_clear_all_timecodes'),
            timeclearall: правда
          });
          Lampa.Select.show({
            название: Lampa.Lang.translate('title_action'),
            пункты: меню,
            onBack: функция onBack() {
              Lampa.Controller.toggle(включено);
            },
            onSelect: функция onSelect(a) {
              если (a.mark) параметры.элемент.mark();
              если (a.снять отметку) параметры.элемент.снять отметку();
              если (a.timeclear) параметры.элемент.timeclear();
              если (a.clearallmark) параметры.onClearAllMark();
              если (a.timeclearall) параметры.onClearAllTime();
              если (window.lampac_online_context_menu)
                window.lampac_online_context_menu.onSelect(a, params);
              Lampa.Controller.toggle(включено);
              если (a.player) {
                Lampa.Player.runas(a.player);
                параметры.html.trigger('hover:enter');
              }
              если (a.copylink) {
                если (экстра.качество) {
                  var qual = [];
                  для (var i в дополнительном качестве) {
                    qual.push({
                      титул: я,
                      файл: extra.quality[i]
                    });
                  }
                  Lampa.Select.show({
                    title: Lampa.Lang.translate('settings_server_links'),
                    предметы: качество,
                    onBack: функция onBack() {
                      Lampa.Controller.toggle(включено);
                    },
                    onSelect: функция onSelect(b) {
                      Lampa.Utils.copyTextToClipboard(b.file, function() {
                        Lampa.Noty.show(Lampa.Lang.translate('copy_secuses'));
                      }, функция() {
                        Lampa.Noty.show(Lampa.Lang.translate('copy_error'));
                      });
                    }
                  });
                } еще {
                  Lampa.Utils.copyTextToClipboard(extra.file, function() {
                    Lampa.Noty.show(Lampa.Lang.translate('copy_secuses'));
                  }, функция() {
                    Lampa.Noty.show(Lampa.Lang.translate('copy_error'));
                  });
                }
              }
              если (a.subscribe) {
                Lampa.Account.subscribeToTranslation({
                  карта: object.movie,
                  сезон: параметры.элемент.сезон,
                  эпизод: параметры.элемент.перевод_эпизода_конец,
                  голос: параметры.элемент.translate_voice
                }, функция() {
                  Lampa.Noty.show(Lampa.Lang.translate('lampac_voice_success'));
                }, функция() {
                  Lampa.Noty.show(Lampa.Lang.translate('lampac_voice_error'));
                });
              }
            }
          });
        }
        параметры.onFile(показать);
      }).on('hover:focus', function() {
        если (Lampa.Helper) Lampa.Helper.show('online_file', Lampa.Lang.translate('helper_online_file'), params.html);
      });
    };
    /**
     * Показать пустой результат
     */
    это.пусто = функция() {
      var html = Lampa.Template.get('lampac_does_not_answer', {});
      html.find('.online-empty__buttons').remove();
      html.find('.online-empty__title').text(Lampa.Lang.translate('empty_title_two'));
      html.find('.online-empty__time').text(Lampa.Lang.translate('empty_text'));
      прокрутить.очистить();
      scroll.append(html);
      эта.загрузка(ложь);
    };
    this.noConnectToServer = function(er) {
      var html = Lampa.Template.get('lampac_does_not_answer', {});
      html.find('.online-empty__buttons').remove();
      html.find('.online-empty__title').text(Lampa.Lang.translate('title_error'));
      html.find('.online-empty__time').text(er && er.accsdb ? er.msg : Lampa.Lang.translate('lampac_does_not_answer_text').replace('{balanser}', balanser[balanser].name));
      прокрутить.очистить();
      scroll.append(html);
      эта.загрузка(ложь);
    };
    это.неОтвет = функция(er) {
      var _this9 = это;
      этот.сброс();
      var html = Lampa.Template.get('lampac_does_not_answer', {
        балансир: балансир
      });
      if(er && er.accsdb) html.find('.online-empty__title').html(er.msg);
	  
      вар тик = эр && er.accsdb ? 10:5;
      html.find('.cancel').on('hover:enter', function() {
        ClearInterval (balanser_timer);
      });
      html.find('.change').on('hover:enter', function() {
        ClearInterval (balanser_timer);
        filter.render().find('.filter--sort').trigger('hover:enter');
      });
      прокрутить.очистить();
      scroll.append(html);
      эта.загрузка(ложь);
      balanser_timer = setInterval(function() {
        тик--;
        html.find('.timeout').text(tic);
        если (тик == 0) {
          ClearInterval (balanser_timer);
          var keys = Lampa.Arrays.getKeys(источники);
          вар indx =keys.indexOf(балансир);
          var next = ключи[indx + 1];
          если (!next) next = keys[0];
          балансер = следующий;
          если (Lampa.Activity.active().activity == _this9.activity) _this9.changeBalanser(balanser);
        }
      }, 1000);
    };
    этот.получитьПоследнийЭпизод = функция(элементы) {
      var last_episode = 0;
      элементы.forEach(функция(e) {
        если (typeof e.episode !== 'undefined') last_episode = Math.max(last_episode, parseInt(e.episode));
      });
      вернуть последний_эпизод;
    };
    /**
     * Начать навигацию по файлам
     */
    этот.старт = функция() {
      если (Lampa.Activity.active().activity !== this.activity) return;
      если (!инициализировано) {
        инициализировано = правда;
        этот.инициализировать();
      }
      Lampa.Background.immediately(Lampa.Utils.cardImgBackgroundBlur(object.movie));
      Lampa.Controller.add('content', {
        переключение: функция toggle() {
          Lampa.Controller.collectionSet(scroll.render(), files.render());
          Lampa.Controller.collectionFocus(last || false, scroll.render());
        },
        ушла: функция ушла() {
          clearTimeout(balanser_timer);
        },
        вверх: функция вверх() {
          если (Навигатор.может двигаться('вверх')) {
            Навигатор.переместить('вверх');
          } else Lampa.Controller.toggle('head');
        },
        вниз: функция down() {
          Навигатор.переместить('вниз');
        },
        справа: функция справа() {
          если (Навигатор. может двигаться('вправо')) Навигатор. двигаться('вправо');
          else filter.show(Lampa.Lang.translate('title_filter'), 'filter');
        },
        слева: функция left() {
          если (Навигатор. может двигаться('влево')) Навигатор. двигаться('влево');
          else Lampa.Controller.toggle('меню');
        },
        назад: это.назад.связать(это)
      });
      Lampa.Controller.toggle('content');
    };
    этот.рендер = функция() {
      return files.render();
    };
    это.обратно = функция() {
      Lampa.Activity.backward();
    };
    эта.пауза = функция() {};
    this.stop = function() {};
    это.уничтожить = функция() {
      сеть.очистить();
      this.clearImages();
      файлы.destroy();
      прокрутить.уничтожить();
      ClearInterval (balanser_timer);
      clearTimeout(life_wait_timer);
    };
  }
  
  функция addSourceSearch(spiderName, spiderUri) {
    вар сеть = новый Lampa.Reguest();

    источник переменной = {
      title: spiderName,
      поиск: функция(параметры, oncomplite) {
        функция searchComplite(ссылки) {
          вар ключи = Lampa.Arrays.getKeys(ссылки);

          если (ключи.длина) {
            var status = new Lampa.Status(keys.length);

            статус.onComplite = функция(результат) {
              var rows = [];

              ключи.forEach(функция(имя) {
                var line = result[имя];

                если (линия && линия.данные && линия.тип == 'подобные') {
                  var cards = line.data.map(function(item) {
                    item.title = Lampa.Utils.capitalizeFirstLetter(item.title);
                    item.release_date = item.year || '0000';
                    item.balanser = spiderUri;
                    если (item.img !== не определено) {
                      если (item.img.charAt(0) === '/')
                        item.img = Defined.localhost + item.img.substring(1);
                      если (item.img.indexOf('/proxyimg') !== -1)
                        item.img = аккаунт(item.img);
                    }

                    возврат товара;
                  })

                  строки.push({
                    титул: имя,
                    результаты: карты
                  })
                }
              })

              oncomplete(строки);
            }

            ключи.forEach(функция(имя) {
              сеть.silent(учетная запись(ссылки[имя]), функция(данные) {
                статус.добавить(имя, данные);
              }, функция() {
                статус.ошибка();
              })
            })
          } еще {
            oncomplite([]);
          }
        }

        сеть. тихий(учетная запись(Определено. локальный хост + 'lite/' + spiderUri + '? title=' + параметры. запрос), функция(json) {
          если (json.rch) {
            rchRun(json, функция() {
              сеть. тихий(учетная запись(Определено. локальный хост + 'lite/' + spiderUri + '? title=' + параметры. запрос), функция(ссылки) {
                searchComplite(ссылки);
              }, функция() {
                oncomplite([]);
              });
            });
          } еще {
            searchComplite(json);
          }
        }, функция() {
          oncomplite([]);
        });
      },
      onCancel: функция() {
        сеть.очистить()
      },
      параметры: {
        ленивый: правда,
        align_left: true,
        события_карты: {
          onMenu: функция() {}
        }
      },
      onMore: функция(параметры, закрыть) {
        закрывать();
      },
      onSelect: функция(параметры, закрыть) {
        закрывать();

        Lampa.Activity.push({
          URL: параметры.элемент.url,
          заголовок: 'Lampac - ' + params.element.title,
          компонент: 'lampac',
          фильм: параметры.элемент,
          страница: 1,
          поиск: параметры.элемент.название,
          уточнение: верно,
          балансировщик: params.element.balanser,
          noinfo: правда
        });
      }
    }

    Lampa.Search.addSource(источник)
  }

  функция startPlugin() {
    window.lampac_plugin = true;
    var manifst = {
      тип: «видео»,
      версия: «1.5.2»,
      имя: «Лампак»,
      описание: 'Плагин для просмотра онлайн сериалов и фильмов',
      компонент: 'lampac',
      onContextMenu: функция onContextMenu(объект) {
        возвращаться {
          имя: Lampa.Lang.translate('lampac_watch'),
          описание: ''
        };
      },
      onContextLauch: функция onContextLauch(объект) {
        resetTemplates();
        Lampa.Component.add('lampac', component);
		
		var id = Lampa.Utils.hash(объект.номер_сезонов ? объект.исходное_имя : объект.исходное_название);
		var all = Lampa.Storage.get('clarification_search','{}');
		
        Lampa.Activity.push({
          URL-адрес: '',
          заголовок: Lampa.Lang.translate('title_online'),
          компонент: 'lampac',
          поиск: all[id] ? all[id] : object.title,
          search_one: object.title,
          search_two: object.original_title,
          фильм: объект,
          страница: 1,
		  уточнение: all[id] ? true : false
        });
      }
    };
	addSourceSearch('Паук', 'паук');
	addSourceSearch('Аниме', 'паук/аниме');
    Lampa.Manifest.plugins = манифст;
    Lampa.Lang.add({
      lampac_watch: { //
        ru: «Смотреть онлайн»,
        ru: 'Смотреть онлайн',
        Великобритания: «Дивитися онлайн»,
        ж: '在线观看'
      },
      lampac_video: { //
        ru: 'Видео',
        ru: 'Видео',
        uk: 'Відео',
        ж: '视频'
      },
      lampac_no_watch_history: {
        ru: 'Нет просмотр истории',
        ru: «Нет истории просмотра»,
        ua: 'Немає историю просмотра',
        zh: '没有浏览历史'
      },
      lampac_nolink: {
        ru: 'Не удалось восстановить ссылку',
        Великобритания: «Невозможно отримати посилання»,
        ru: «Не удалось получить ссылку»,
        ж: '获取链接失败'
      },
      lampac_balanser: { //
        ru: 'Источник',
        uk: 'Джерело',
        ru: 'Источник',
        ж: '来源'
      },
      helper_online_file: { //
        ru: 'Удерживайте кнопку "ОК" для вызова контекстного меню',
        uk: 'Утримуйте клавишу «ОК» для вызова контекстного меню',
        ru: «Удерживайте клавишу «ОК», чтобы открыть контекстное меню»,
        zh: '按住“确定”键调出上下文菜单'
      },
      title_online: { //
        ru: 'Онлайн',
        uk: 'Онлайн',
        ru: 'Online',
        ж: '在线的'
      },
      lampac_voice_subscribe: { //
        ru: 'Подписаться на перевод',
        uk: 'Подписаться на перевод',
        ru: «Подписаться на перевод»,
        ж: '订阅翻译'
      },
      lampac_voice_success: { //
        ru: 'Вы успешно поддерживаетесь',
        uk: 'Вы успешно написали',
        ru: «Вы успешно подписались»,
        zh: '您已成功订阅'
      },
      lampac_voice_error: { //
        ru: 'Возникла ошибка',
        Великобритания: «Виникла помилка»,
        ru: «Произошла ошибка»,
        ж: '发生了错误'
      },
      lampac_clear_all_marks: { //
        ru: 'Очистить все метки',
        Великобритания: «Очистить все митки»,
        ru: 'Очистить все метки',
        zh: '清除所有标签'
      },
      lampac_clear_all_timecodes: { //
        ru: 'Очистить все тайм-коды',
        Великобритания: «Очистить все тайм-коды»,
        ru: 'Очистить все таймкоды',
        zh: '清除所有时间代码'
      },
      lampac_change_balanser: { //
        ru: 'Изменить балансер',
        Великобритания: «Зминити балансер»,
        ru: 'Изменить балансировщик',
        ж: '更改平衡器'
      },
      lampac_balanser_dont_work: { //
        ru: 'Поиск на ({balanser}) не дал результатов',
        uk: 'Пощук на ({balanser}) не дал результатов',
        ru: «Поиск по ({balanser}) не дал результатов»,
        zh: '搜索 ({balanser}) 未返回任何结果'
      },
      lampac_balanser_timeout: { //
        ru: 'Источник будет переключен автоматически через <span class="timeout">10</span> секунд.',
        uk: 'Джерело будет автоматически переключено через <span class="timeout">10</span> секунд.',
        ru: «Источник будет автоматически переключен через <span class="timeout">10</span> секунд».
        zh: '平衡器将在<span class="timeout">10</span>秒内自动切换。'
      },
      lampac_does_not_answer_text: {
        ru: 'Поиск на ({balanser}) не дал результатов',
        uk: 'Пощук на ({balanser}) не дал результатов',
        ru: «Поиск по ({balanser}) не дал результатов»,
        zh: '搜索 ({balanser}) 未返回任何结果'
      }
    });
    Lampa.Template.add('lampac_css', "\n <style>\n @charset 'UTF-8';.online-prestige{position:relative;-webkit-border-radius:.3em;border-radius:.3em;background-color:rgba(0,0,0,0.3);display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex}.online-prestige__body{padding:1.2em;line-height:1.3;-webkit-box-flex:1;-webkit-flex-grow:1;-moz-box-flex:1;-ms-flex-positive:1;flex-grow:1;position:relative}@media screen и (макс. ширина: 480 пикселей) {.online-prestige__body {padding: .8em 1.2em}}.online-prestige__img {position: относительн.; ширина: 13em; -webkit-flex-shrink: 0; -ms-flex-negative: 0; flex-shrink: 0; мин. высота: 8.2em}.online-prestige__img>img {position: абсолютн.; верх: 0; лево: 0; ширина: 100%; высота: 100%; -o-object-fit: cover; object-fit: cover; -webkit-border-radius: .3em; border-radius: .3em; непрозрачность: 0; -webkit-transition: непрозрачность .3s; -o-transition: непрозрачность .3s; -moz-transition: непрозрачность .3s; переход: непрозрачность .3s}.online-prestige__img--loaded>img{opacity:1}@media screen и (max-width:480px){.online-prestige__img{width:7em;min-height:6em}}.online-prestige__folder{padding:1em;-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0}.online-prestige__folder>svg{width:4.4em !important;height:4.4em !важно}.online-prestige__viewed{position:absolute;top:1em;left:1em;background:rgba(0,0,0,0.45);-webkit-border-radius:100%;border-radius:100%;padding:.25em;font-size:.76em}.online-prestige__viewed>svg{width:1.5em !важно;height:1.5em !важно}.online-prestige__episode-number{position:absolute;top:0;left:0;right:0;bottom:0;display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-item s:center;-webkit-box-pack:center;-webkit-justify-content:center;-moz-box-pack:center;-ms-flex-pack:center;justify-content:center;размер шрифта:2em}.online-prestige__loader{position:absolute;top:50%;left:50%;width:2em;height:2em;margin-left:-1em;margin-top:-1em;background:url(./img/loader.svg) неповторяющийся центр центр;-webkit-background-size:contain;-o-background-size:contain;background-size:contain}.online-prestige__head,.online-prestige__footer{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-pack:justify;-webkit-justify-content:space-between;-moz-box-pack:justify;-ms-flex-pack:justify;justify-content:space-between;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center}.online-prestige__timeline{margin:.8em 0}.online-prestige__timeline>.time-line{display:block !important}.online-prestige__title{font-size:1.7em;overflow:hidden;-o-text-overflow:ellipsis;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:1;line-clamp:1;-webkit-box-orient:vertical}@media screen и (max-width:480px){.online-prestige__title{font-size:1.4em}}.online-prestige__time{padding-left:2em}.online-prestige__info{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center}.online-prestige__info>*{overflow:hidden;-o-text-ov erflow:многоточие;text-overflow:многоточие;display:-webkit-box;-webkit-line-clamp:1;line-clamp:1;-webkit-box-orient:vertical}.online-prestige__quality{padding-left:1em;white-space:nowrap}.online-prestige__scan-file{position:absolute;bottom:0;left:0;right:0}.online-prestige__scan-file .broadcast__scan{margin:0}.online-prestige .online-prestige-split{font-size:.8em;margin:0 1em;-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0}.online-prestige.focus::after{content:'';position:absolute;top:-0.6em;left:-0.6em;right:-0.6em;bottom:-0.6em;-webkit-border-radius:.7em;border-radius:.7em;border:solid .3em #fff;z-index:-1;pointer-events:none}.online-prestige+.online-prestige{margin-top:1.5em}.online-prestige--folder .online-prestige__footer{margin-top:.8em}.online-prestige-watched{padding:1em}.online-prestige-watched__icon>svg{width:1.5em;height:1.5em}.online-prestige-watched__body{padding-left:1em;padding-top:.1em;display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-flex-wrap:wrap;-ms-flex-wrap:wrap;flex-wrap:wrap}.online-prestige-watched__body>span+span::before{content:' ● ';vertical-align:top;display:inline-block;margin:0 .5em}.online-prestige-rate{display:-webkit-inline-box;display:-webkit-inline-flex;display:-moz-inline-box;display:-ms-inline-flexbox;display:inline-flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center}.online-prestige-rate>svg{width:1.3em !important;height:1.3em !важно}.online-prestige-rate>span{font-weight:600;font-size:1.1em;padding-left:.7em}.online-empty{line-height:1.4}.online-empty__title{font-size:1.8em;margin-bottom:.3em}.online-empty__time{font-size:1.2em;font-weight:300;margin-bottom: 1.6em}.online-empty__buttons{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex}.online-empty__buttons>*+*{margin-left:1em}.online-empty__button{background:rgba(0,0,0,0.3);font-size:1.2em;padding:.5em 1.2em;-webkit-border-radius:.2em;border-radius:.2em;margin-bottom:2.4em}.online-empty__button.focus{background:#fff;color:black}.online-empty__templates .online-empty-template:nth-child(2){opacity:.5}.online-empty__templates .online-empty-template:nth-child(3){opacity:.2}.online-empty-template{background-color:rgba(255,255,255,0.3);padding:1em;display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center;-webkit-border-radius:.3em;border-radius:.3em}.online-empty-template>*{background:rgba(0,0,0,0.3);-webkit-border-radius:.3em;border-radius:.3em}.online-empty-template__ico{ширина:4em;высота:4em;правое поле:2.4em}.online-empty-template__body{высота:1.7em;ширина:70%}.online-empty-template+.online-empty-template{верхнее поле:1em}\n </style>\n ");
    $('body').append(Lampa.Template.get('lampac_css', {}, true));

    функция resetTemplates() {
      Lampa.Template.add('lampac_prestige_full', "<div class=\"online-prestige online-prestige--full selector\">\n <div class=\"online-prestige__img\">\n <img alt=\"\">\n <div class=\"online-prestige__loader\"></div>\n </div>\n <div class=\"online-prestige__body\">\n <div class=\"online-prestige__head\">\n <div class=\"online-prestige__title\">{title}</div>\n <div class=\"online-prestige__time\">{time}</div>\n </div>\n\n <div class=\"online-prestige__timeline\"></div>\n\n <div class=\"online-prestige__footer\">\n <div class=\"online-prestige__info\">{info}</div>\n <div class=\"online-prestige__quality\">{quality}</div>\n </div>\n </div>\n </div>");
      Lampa.Template.add('lampac_content_loading', "<div class=\"online-empty\">\n <div class=\"broadcast__scan\"><div></div></div>\n\t\t\t\n <div class=\"online-empty__templates\">\n <div class=\"online-empty-template selector\">\n <div class=\"online-empty-template__ico\"></div>\n <div class=\"online-empty-template__body\"></div>\n </div>\n <div class=\"online-empty-template\">\n <div class=\"online-empty-template__ico\"></div>\n <div class=\"online-empty-template__body\"></div>\n </div>\n <div class=\"online-empty-template\">\n <div class=\"online-empty-template__ico\"></div>\n <div class=\"online-empty-template__body\"></div>\n </div>\n </div>\n </div>");
      Lampa.Template.add('lampac_does_not_answer', "<div class=\"online-empty\">\n <div class=\"online-empty__title\">\n #{lampac_balanser_dont_work}\n </div>\n <div class=\"online-empty__time\">\n #{lampac_balanser_timeout}\n </div>\n <div class=\"online-empty__buttons\">\n <div class=\"online-empty__button селектор отмена\">#{cancel}</div>\n <div class=\"online-empty__button селектор изменение\">#{lampac_change_balanser}</div>\n </div>\n <div class=\"online-empty__templates\">\n <div class=\"online-empty-template\">\n <div class=\"online-empty-template__ico\"></div>\n <div class=\"online-empty-template__body\"></div>\n </div>\n <div class=\"online-empty-template\">\n <div class=\"online-empty-template__ico\"></div>\n <div class=\"online-empty-template__body\"></div>\n </div>\n <div class=\"online-empty-template\">\n <div class=\"online-empty-template__ico\"></div>\n <div class=\"online-empty-template__body\"></div>\n </div>\n </div>\n </div>");
      Lampa.Template.add('lampac_prestige_rate', "<div class=\"online-prestige-rate\">\n <svg width=\"17\" height=\"16\" viewBox=\"0 0 17 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n <path d=\"M8.39409 0.192139L10.99 5.30994L16.7882 6.20387L12.5475 10.4277L13.5819 15.9311L8.39409 13.2425L3.20626 15.9311L4.24065 10.4277L0 6,20387L5,79819 5,30994L8,39409 0,192139Z\" fill=\"#fff\"></path>\n </svg>\n <span>{rate}</span>\n </div>");
      Lampa.Template.add('lampac_prestige_folder', "<div class=\"online-prestige online-prestige--folder selector\">\n <div class=\"online-prestige__folder\">\n <svg viewBox=\"0 0 128 112\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n <rect y=\"20\" width=\"128\" height=\"92\" rx=\"13\" fill=\"white\"></rect>\n <path d=\"M29.9963 8H98.0037C96.0446 3.3021 91.4079 0 86 0H42C36.5921 0 31.9555 3.3021 29,9963 8Z\" fill=\"white\" fill-opacity=\"0.23\"></path>\n <rect x=\"11\" y=\"8\" width=\"106\" height=\"76\" rx=\"13\" fill=\"white\" fill-opacity=\"0.51\"></rect>\n </svg>\n </div>\n <div class=\"online-prestige__body\">\n <div class=\"online-prestige__head\">\n <div class=\"online-prestige__title\">{title}</div>\n <div class=\"online-prestige__time\">{time}</div>\n </div>\n\n <div class=\"online-prestige__footer\">\n <div class=\"online-prestige__info\">{info}</div>\n </div>\n </div>\n </div>");
      Lampa.Template.add('lampac_prestige_watched', "<div class=\"online-prestige online-prestige-watched selector\">\n <div class=\"online-prestige-watched__icon\">\n <svg width=\"21\" height=\"21\" viewBox=\"0 0 21 21\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n <circle cx=\"10.5\" cy=\"10.5\" r=\"9\" stroke=\"currentColor\" stroke-width=\"3\"/>\n <path d=\"M14.8477 10.5628L8.20312 14.399L8.20313 6.72656L14.8477 10.5628Z\" fill=\"currentColor\"/>\n </svg>\n </div>\n <div class=\"online-prestige-watched__body\">\n \n </div>\n </div>");
    }
    var button = "<div class=\"full-start__button selector view--online lampac--button\" data-subtitle=\"".concat(manifst.name, " v").concat(manifst.version, "\">\n <svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" viewBox=\"0 0 392.697 392.697\" xml:space=\"preserve\">\n <path d=\"M21.837,83.419l36.496,16.678L227.72,19.886c1.229-0.592,2 .002-1.846,1.98-3.209c-0.021-1.365-0.834-2.592-2.082-3.145\n L197.766,0.3c-0.903-0.4-1.933-0.4-2.837,0L21.873,77.036c-1.259,0.559-2.073,1.803-2.081,3.18\n C19.784,81.593,20.584,82.847,21.837,83.419z\" fill=\"currentColor\"></path>\n <path d=\"M185.689,177.261l-64.988-30.01v91.617c0,0.856-0.44,1.655-1.167,2.114c-0.406,0.257-0.869,0.386-1.333,0.386\n c-0,368,0-0,736-0,082-1,079-0,244l-68,874-32,625c-0,869-0,416-1,421-1,293-1,421-2,256v-92,229L6,804,95,5\n c-1,083-0,496-2,344-0,406-3,347,0,238c-1,002,0,645-1,608,1,754-1,608,2,944v208,744c0,1,371,0,799,2,615,2,045,3,185\n l178.886,81.768c0.464,0.211,0.96,0.315,1.455,0.315c0.661,0,1.318-0.188,1.892-0.555c1.002-0.645,1.608-1.754,1.608-2.945\n V180.445C187.735,179.076,186.936,177.831,185.689,177.261z\" fill=\"currentColor\"></path>\n <path d=\"M389.24,95.74c-1.002-0.644-2.264-0.732-3.347-0.238l-178.876,81.76c-1.246,0.57-2.045,1.814-2.045,3.185v208.751\n c0,1.191,0.606,2.302,1.608,2.945c0.572,0.367,1.23,0.555,1.892,0.555c0.495,0,0.991-0.104,1.455-0.315l178.876-81.768\n c1.246-0.568,2.045-1.813,2.045-3.185V98.685C390.849,97.494,390.242,96.384,389.24,95.74z\" fill=\"currentColor\"></path>\n <path d=\"M372.915,80.216c-0.009-1.377-0.823-2.621-2.082-3.18l-60.182-26.681c-0.938-0.418-2.013-0.399-2.938,0.045\n l-173.755,82.992l60.933,29.117c0.462,0.211,0.958,0.316,1.455,0.316s0.993-0.105,1.455-0.316l173.066-79.092\n C372.122,82.847,372.923,81.593,372.915,80.216z\" fill=\"currentColor\"></path>\n </svg>\n\n <span>#{title_online</span>\n </div>"); // нужна заглушка, а то при страте лампа говорит пусто
    Lampa.Component.add('lampac', компонент); //то же самое
    resetTemplates();

    функция addButton(e) {
      если (e.render.find('.lampac--button').length) return;
      var btn = $(Lampa.Lang.translate(кнопка));
	  // //console.log(btn.clone().removeClass('focus').prop('outerHTML'))
      btn.on('hover:enter', function() {
        resetTemplates();
        Lampa.Component.add('lampac', component);
		
		var id = Lampa.Utils.hash(e.movie.number_of_seasons ? e.movie.original_name : e.movie.original_title);
		var all = Lampa.Storage.get('clarification_search','{}');
		
        Lampa.Activity.push({
          URL-адрес: '',
          заголовок: Lampa.Lang.translate('title_online'),
          компонент: 'lampac',
          поиск: all[id] ? all[id] : e.movie.title,
          search_one: e.movie.title,
          search_two: e.movie.original_title,
          фильм: e.movie,
          страница: 1,
		  уточнение: all[id] ? true : false
        });
      });
      e.render.after(btn);
    }
    Lampa.Listener.follow('full', function(e) {
      если (e.type == 'complete') {
        добавитькнопку({
          рендер: e.object.activity.render().find('.view--torrent'),
          фильм: e.data.movie
        });
      }
    });
    пытаться {
      если (Lampa.Activity.active().component == 'full') {
        добавитькнопку({
          рендер: Lampa.Activity.active().activity.render().find('.view--torrent'),
          фильм: Lampa.Activity.active().card
        });
      }
    } поймать (е) {}
    если (Lampa.Manifest.app_digital >= 177) {
      var balansers_sync = ["filmix", 'filmixtv', "fxapi", "rezka", "rhsprem", "lumex", "videodb", "collaps", "collaps-dash", "hdvb", "zetflix", "kodik", "ashdi", "kinoukr", "kinotochka", "remux", "iframevideo", "cdnmovies", "anilibria", "animedia", "animego", "animevost", "animebesst", "redheadsound", "alloha", "animelib", "moonanime", "kinopub", "vibix", "vdbmovies", "fancdn", "cdnvideohub", "vokino", "rc/filmix", "rc/fxapi", "rc/rhs", "vcdn", "videocdn", "mirage", "hydraflix", "videasy", "vidsrc", "movpi", "vidlink", "twoembed", "autoembed", "smashystream", "autoembed", "rgshows", "pidtor", "videoseed", "iptvonline", "veoveo"];
      balansers_sync.forEach(функция(имя) {
        Lampa.Storage.sync('online_choice_' + name, 'object_object');
      });
      Lampa.Storage.sync('online_watched_last', 'object_object');
    }
  }
  если (!window.lampac_plugin) startPlugin();

})();
