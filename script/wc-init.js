(function() {
	//navigator.whenDefined
	if (typeof navigator.whenDefined !== 'function') {
		Object.defineProperty(navigator, 'whenDefined', {
			configurable: false,
			enumerable: true,
			value: function() {
				let units;

				units = Array.from(arguments);
				if (units.indexOf('document.body') === -1) {
					units.push('document.body');
				}
				const promises = units.map(
					(unit) => {
						return new Promise((resolve, reject) => {
							let c, max, iid
							
							c = 0;
							max = 10000;

							iid = setInterval(() => {
								let _root, parts
								c += 5;
								if (c > max) {
									clearInterval(iid);
									reject(new Error(`"${unit}" unit missing.`));
								}

								_root = window;
								parts = unit.split('.');
								while (parts.length) {
									let prop
									prop = parts.shift();
									if (typeof _root[prop] === 'undefined') {
										_root = null;
										break;
									} else {
										_root = _root[prop];
									}
								}

								if (_root !== null && document.readyState && document.readyState !== 'loading') {
									clearInterval(iid);
									resolve();
								}
							}, 5);
						});
					}
				)

				return Promise.all(promises);
			}
		});
	}

	//customElements define
	navigator.whenDefined('_wcl', 'MscSidebar').then(
		() => {
			let menu, sidebar, share;

			menu = document.querySelector('.header__menu');
			sidebar = document.querySelector('msc-sidebar');
			share = document.querySelector('.header__share');
			menu.addEventListener('click',
				(e) => {
					e.preventDefault();
					sidebar.toggle();
				}
			);

			//web share
			if (navigator.share && share) {
				share.classList.add('header__share--active');
				share.addEventListener('click',
					(e) => {
						e.preventDefault();
						navigator.share({
							title: document.title,
							text: document.querySelector('meta[name=description]').content,
							url: document.querySelector('link[rel=canonical]').href
						})
							.then(() => console.log('Successful share'))
							.catch((error) => console.log('Error sharing', error));

					}
				);
			}
		},
		(err) => {
			console.error(`${_wcl.classToTagName('MscSidebar')}: ${err.message}`);
		}
	);
})();