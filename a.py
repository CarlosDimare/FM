#!/usr/bin/env python3
"""
SoccerWiki Navigator - Aplicación de escritorio
Muestra TODA la información del club en una sola página
"""

import tkinter as tk
from tkinter import ttk, scrolledtext, messagebox, filedialog
import requests
from bs4 import BeautifulSoup
import json
import threading
from urllib.parse import urljoin
import re

class SoccerWikiApp:
    def __init__(self, root):
        self.root = root
        self.root.title("⚽ ")
        self.root.geometry("1600x1000")
        self.root.configure(bg='#1e3c72')
        
        self.current_data = None
        self.current_type = None
        self.base_url = "https://es.soccerwiki.org/"
        
        # Configurar estilos
        self.setup_styles()
        
        # Crear interfaz
        self.create_header()
        self.create_controls()
        self.create_content_area()
        
    def setup_styles(self):
        """Configurar estilos personalizados"""
        style = ttk.Style()
        style.theme_use('clam')
        
        style.configure('Primary.TButton', 
                       background='#1e3c72',
                       foreground='white',
                       font=('Segoe UI', 10, 'bold'),
                       padding=10)
        style.map('Primary.TButton',
                 background=[('active', '#2a5298')])
        
        style.configure('Success.TButton',
                       background='#27ae60',
                       foreground='white',
                       font=('Segoe UI', 10, 'bold'),
                       padding=10)
        style.map('Success.TButton',
                 background=[('active', '#229954')])
        
        # Estilo para Treeview
        style.configure('Custom.Treeview',
                       background='white',
                       foreground='black',
                       rowheight=30,
                       fieldbackground='white',
                       font=('Segoe UI', 10))
        style.configure('Custom.Treeview.Heading',
                       font=('Segoe UI', 10, 'bold'),
                       background='#1e3c72',
                       foreground='white')
        style.map('Custom.Treeview',
                 background=[('selected', '#3498db')])
        
    def create_header(self):
        """Crear header de la aplicación"""
        header = tk.Frame(self.root, bg='white', pady=20)
        header.pack(fill=tk.X, padx=20, pady=(20, 10))
        
        title = tk.Label(header, 
                        text="⚽ ",
                        font=('Segoe UI', 28, 'bold'),
                        bg='white',
                        fg='#1e3c72')
        title.pack()
        
        subtitle = tk.Label(header,
                           text="...",
                           font=('Segoe UI', 12),
                           bg='white',
                           fg='#666')
        subtitle.pack()
        
    def create_controls(self):
        """Crear controles de navegación"""
        controls = tk.Frame(self.root, bg='white', pady=15)
        controls.pack(fill=tk.X, padx=20, pady=10)
        
        # URL Input
        url_frame = tk.Frame(controls, bg='white')
        url_frame.pack(fill=tk.X, padx=20, pady=10)
        
        tk.Label(url_frame, text="URL:", font=('Segoe UI', 10, 'bold'), 
                bg='white').pack(side=tk.LEFT, padx=(0, 10))
        
        self.url_entry = tk.Entry(url_frame, font=('Segoe UI', 11), width=60)
        self.url_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=5)
        self.url_entry.insert(0, "https://es.soccerwiki.org/country.php?countryId=ARG")
        
        self.load_btn = ttk.Button(url_frame, 
                                   text="🔍 Cargar",
                                   style='Primary.TButton',
                                   command=self.fetch_and_parse)
        self.load_btn.pack(side=tk.LEFT, padx=5)
        
        # Quick Links
        links_frame = tk.Frame(controls, bg='white')
        links_frame.pack(fill=tk.X, padx=20, pady=10)
        
        tk.Label(links_frame, text="Ligas rápidas:", 
                font=('Segoe UI', 10, 'bold'), bg='white').pack(side=tk.LEFT, padx=(0, 10))
        
        quick_links = [
            ("🇦🇷 Argentina", "https://es.soccerwiki.org/country.php?countryId=ARG"),
            ("🇪🇸 España", "https://es.soccerwiki.org/country.php?countryId=ESP"),
            ("🇧🇷 Brasil", "https://es.soccerwiki.org/country.php?countryId=BRA"),
            ("🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra", "https://es.soccerwiki.org/country.php?countryId=ENG"),
            ("🇮🇹 Italia", "https://es.soccerwiki.org/country.php?countryId=ITA"),
        ]
        
        for text, url in quick_links:
            btn = tk.Button(links_frame, text=text, 
                          bg='#ecf0f1', 
                          font=('Segoe UI', 9),
                          relief=tk.RAISED,
                          cursor='hand2',
                          command=lambda u=url: self.load_url(u))
            btn.pack(side=tk.LEFT, padx=3)
        
        # Breadcrumb
        self.breadcrumb = tk.Label(controls, text="", 
                                   font=('Segoe UI', 10), 
                                   bg='#f8f9fa',
                                   anchor='w',
                                   padx=10,
                                   pady=8)
        self.breadcrumb.pack(fill=tk.X, padx=20, pady=(10, 0))
        
    def create_content_area(self):
        """Crear área de contenido con scroll"""
        container = tk.Frame(self.root, bg='white')
        container.pack(fill=tk.BOTH, expand=True, padx=20, pady=10)
        
        canvas = tk.Canvas(container, bg='white', highlightthickness=0)
        scrollbar = ttk.Scrollbar(container, orient='vertical', command=canvas.yview)
        
        self.content_frame = tk.Frame(canvas, bg='white')
        self.content_frame.bind(
            '<Configure>',
            lambda e: canvas.configure(scrollregion=canvas.bbox('all'))
        )
        
        canvas.create_window((0, 0), window=self.content_frame, anchor='nw')
        canvas.configure(yscrollcommand=scrollbar.set)
        
        canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        def on_mousewheel(event):
            canvas.yview_scroll(int(-1*(event.delta/120)), "units")
        canvas.bind_all("<MouseWheel>", on_mousewheel)
        
    def load_url(self, url):
        """Cargar URL en el campo de entrada y parsear"""
        self.url_entry.delete(0, tk.END)
        self.url_entry.insert(0, url)
        self.fetch_and_parse()
        
    def fetch_and_parse(self):
        """Obtener y parsear URL en un thread separado"""
        url = self.url_entry.get().strip()
        
        if not url:
            messagebox.showwarning("Error", "Por favor ingresa una URL válida")
            return
        
        self.load_btn.configure(state='disabled')
        self.show_loading("Cargando datos de SoccerWiki...")
        
        thread = threading.Thread(target=self._fetch_thread, args=(url,))
        thread.daemon = True
        thread.start()
        
    def _fetch_thread(self, url):
        """Thread para hacer la petición HTTP"""
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()
            
            html = response.text
            
            if 'country.php' in url:
                self.current_type = 'clubs'
                self.current_data = self.parse_clubs(html)
                self.root.after(0, lambda: self.display_clubs(self.current_data))
            elif 'squad.php' in url:
                self.current_type = 'squad'
                # Parsear lista de jugadores primero
                basic_data = self.parse_full_club(html, url)
                
                # Actualizar UI para mostrar progreso
                self.root.after(0, lambda: self.show_loading("Cargando detalles de jugadores..."))
                
                # Fetch full details for each player
                players_with_full_details = []
                total = len(basic_data['players'])
                
                for i, basic_player in enumerate(basic_data['players']):
                    progress = f"Cargando jugador {i+1} de {total}: {basic_player.get('name', 'Jugador')}"
                    self.root.after(0, lambda msg=progress: self.show_loading(msg))
                    
                    # Fetch full player details
                    full_player = self.fetch_player_full_details(basic_player, headers)
                    players_with_full_details.append(full_player)
                
                # Update club data with full player details
                self.current_data = {
                    'clubName': basic_data['clubName'],
                    'clubId': basic_data['clubId'],
                    'clubInfo': basic_data['clubInfo'],
                    'players': players_with_full_details,
                    'totalPlayers': len(players_with_full_details)
                }
                
                self.root.after(0, lambda: self.display_full_club(self.current_data))
            elif 'player.php' in url:
                self.current_type = 'player'
                self.current_data = self.parse_player(html, url)
                self.root.after(0, lambda: self.display_player(self.current_data))
            else:
                self.root.after(0, lambda: messagebox.showerror("Error", "Tipo de URL no reconocida"))
                
            self.root.after(0, self.update_breadcrumb)
            
        except requests.exceptions.RequestException as error:
            error_msg = str(error)
            self.root.after(0, lambda msg=error_msg: messagebox.showerror("Error de Red", f"No se pudo cargar la página:\n{msg}"))
        except Exception as error:
            error_msg = str(error)
            self.root.after(0, lambda msg=error_msg: messagebox.showerror("Error", f"Error al procesar datos:\n{msg}"))
        finally:
            self.root.after(0, lambda: self.load_btn.configure(state='normal'))
            self.root.after(0, self.hide_loading)
    
    def fetch_player_full_details(self, basic_player, headers):
        """Fetch full player details from their player.php page"""
        player_url = f"{self.base_url}player.php?pid={basic_player.get('playerId', '')}"
        
        try:
            response = requests.get(player_url, headers=headers, timeout=15)
            response.raise_for_status()
            
            full_data = self.parse_player(response.text, player_url)
            
            # Merge with basic data, preferring full data
            merged = basic_player.copy()
            for key, value in full_data.items():
                if value:  # Only update if full data has value
                    merged[key] = value
            
            return merged
            
        except Exception as e:
            print(f"Error fetching player {basic_player.get('name')}: {e}")
            return basic_player
    
    def show_loading(self, message):
        """Mostrar mensaje de carga"""
        for widget in self.content_frame.winfo_children():
            widget.destroy()
        
        self.loading_label = tk.Label(self.content_frame,
                                     text=f"⏳ {message}",
                                     font=('Segoe UI', 14),
                                     bg='white',
                                     fg='#1e3c72')
        self.loading_label.pack(pady=50)
    
    def hide_loading(self):
        """Ocultar mensaje de carga"""
        if hasattr(self, 'loading_label') and self.loading_label.winfo_exists():
            self.loading_label.destroy()
    
    def parse_clubs(self, html):
        """Parsear clubes desde HTML"""
        soup = BeautifulSoup(html, 'html.parser')
        clubs = []
        
        tables = soup.find_all('table', class_='table-roster')
        
        for table in tables:
            league_article = table.find_previous('article', class_='post-classic')
            league_name = 'Desconocida'
            
            if league_article:
                league_link = league_article.find('a')
                if league_link:
                    league_name = league_link.get_text(strip=True)
            
            rows = table.find_all('tr')
            for idx, row in enumerate(rows):
                if idx == 0:
                    continue
                
                cells = row.find_all('td')
                if len(cells) < 3:
                    continue
                
                link = cells[1].find('a')
                img = cells[0].find('img')
                
                if link:
                    href = link.get('href', '')
                    club_id = ''
                    if 'clubid=' in href:
                        club_id = href.split('clubid=')[1].split('&')[0]
                    
                    full_url = urljoin(self.base_url, href)
                    
                    clubs.append({
                        'id': club_id,
                        'name': link.get_text(strip=True),
                        'logo': img.get('data-src', img.get('src', '')) if img else '',
                        'foundationYear': cells[2].get_text(strip=True),
                        'location': cells[3].get_text(strip=True) if len(cells) > 3 else '',
                        'league': league_name,
                        'url': full_url
                    })
        
        return clubs
    
    def parse_full_club(self, html, url):
        """Parsear TODA la información del club"""
        soup = BeautifulSoup(html, 'html.parser')
        
        club_name = soup.find('h1')
        club_name = club_name.get_text(strip=True) if club_name else 'Club'
        
        club_id = ''
        if 'clubid=' in url:
            club_id = url.split('clubid=')[1].split('&')[0]
        
        # Información del club
        club_info = {
            'stadium': '',
            'capacity': '',
            'founded': '',
            'coach': '',
            'location': ''
        }
        
        # Buscar info del club
        info_sections = soup.find_all(['dl', 'div', 'p'])
        text = soup.get_text()
        
        # Parsear jugadores de la tabla principal
        players = []
        
        # Buscar la tabla de roster/squad
        main_table = soup.find('table', class_='table-roster')
        if not main_table:
            main_table = soup.find('table', {'id': re.compile('squad|roster', re.I)})
        if not main_table:
            # Buscar cualquier tabla grande
            tables = soup.find_all('table')
            for table in tables:
                rows = table.find_all('tr')
                if len(rows) > 5:  # Tabla con varios jugadores
                    main_table = table
                    break
        
        if main_table:
            rows = main_table.find_all('tr')
            
            for row in rows:
                # Verificar si es un jugador (tiene link a player.php)
                player_link = row.find('a', href=lambda x: x and 'player.php' in x)
                
                if not player_link:
                    continue
                
                player_data = {
                    'squadNumber': '',
                    'name': '',
                    'position': '',
                    'nationality': '',
                    'age': '',
                    'height': '',
                    'weight': '',
                    'foot': '',
                    'birthDate': '',
                    'rating': '',
                    'photo': '',
                    'playerId': '',
                }
                
                # Nombre y ID
                player_data['name'] = player_link.get_text(strip=True)
                href = player_link.get('href', '')
                if 'pid=' in href:
                    player_data['playerId'] = href.split('pid=')[1].split('&')[0]
                
                # Buscar en todas las celdas de la fila
                cells = row.find_all('td')
                
                for cell in cells:
                    cell_text = cell.get_text(strip=True)
                    
                    # Número de dorsal (badge especial)
                    squad_badge = cell.find(class_=['squad-number-footer', 'squad-number'])
                    if squad_badge:
                        num = squad_badge.get_text(strip=True)
                        if num.isdigit():
                            player_data['squadNumber'] = num
                    
                    # Foto
                    img = cell.find('img')
                    if img:
                        src = img.get('data-src', img.get('src', ''))
                        if 'player' in src:
                            player_data['photo'] = src
                    
                    # Nacionalidad (bandera)
                    flag = cell.find(class_='flag-icon')
                    if flag:
                        classes = flag.get('class', [])
                        for cls in classes:
                            if cls.startswith('flag-icon-') and cls != 'flag-icon':
                                player_data['nationality'] = cls.replace('flag-icon-', '').upper()
                    
                    # Posición (span con title)
                    pos_span = cell.find('span', {'title': True})
                    if pos_span:
                        title = pos_span.get('title', '').strip()
                        if title in ['Portero', 'Defensa', 'Centrocampista', 'Delantero', 
                                   'Goalkeeper', 'Defender', 'Midfielder', 'Forward']:
                            player_data['position'] = title
                    
                    # También buscar posición en atributos data-*
                    if cell.get('data-position'):
                        player_data['position'] = cell.get('data-position')
                    
                    # Edad - solo si es un número de 2 dígitos entre 15-45
                    if cell_text.isdigit() and 15 <= int(cell_text) <= 45:
                        if not player_data['age']:  # Solo si aún no tiene edad
                            player_data['age'] = cell_text
                    
                    # Altura
                    if 'cm' in cell_text:
                        height_match = re.search(r'(\d{2,3})\s*cm', cell_text)
                        if height_match:
                            h = int(height_match.group(1))
                            if 150 <= h <= 220:  # Rango realista
                                player_data['height'] = height_match.group(1) + ' cm'
                    
                    # Peso
                    if 'kg' in cell_text:
                        weight_match = re.search(r'(\d{2,3})\s*kg', cell_text)
                        if weight_match:
                            w = int(weight_match.group(1))
                            if 50 <= w <= 120:  # Rango realista
                                player_data['weight'] = weight_match.group(1) + ' kg'
                    
                    # Pie (buscar en texto de celda)
                    cell_lower = cell_text.lower()
                    if 'derecho' in cell_lower or 'right' in cell_lower:
                        player_data['foot'] = 'Derecho'
                    elif 'izquierdo' in cell_lower or 'left' in cell_lower:
                        player_data['foot'] = 'Izquierdo'
                    elif 'ambos' in cell_lower or 'both' in cell_lower:
                        player_data['foot'] = 'Ambos'
                    
                    # Fecha de nacimiento
                    date_match = re.search(r'(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})', cell_text)
                    if date_match:
                        player_data['birthDate'] = f"{date_match.group(1)}/{date_match.group(2)}/{date_match.group(3)}"
                    
                    # Rating/Valoración (número entre 1-100)
                    rating_match = re.search(r'\b(\d{1,2})\b', cell_text)
                    if rating_match and not player_data['rating']:
                        r = int(rating_match.group(1))
                        if 1 <= r <= 100:
                            player_data['rating'] = rating_match.group(1)
                
                # Agregar jugador
                if player_data['name'] and player_data['playerId']:
                    players.append(player_data)
        
        # Si no encontró jugadores en tabla, buscar en divs/sections
        if not players:
            player_links = soup.find_all('a', href=lambda x: x and 'player.php' in x)
            
            for link in player_links:
                player_name = link.get_text(strip=True)
                if not player_name or len(player_name) < 3:
                    continue
                    
                href = link.get('href', '')
                if 'pid=' not in href:
                    continue
                
                player_id = href.split('pid=')[1].split('&')[0]
                
                # Buscar contenedor del jugador
                container = link.find_parent(['div', 'tr', 'li'])
                if not container:
                    continue
                
                player_data = {
                    'squadNumber': '',
                    'name': player_name,
                    'position': '',
                    'nationality': '',
                    'age': '',
                    'height': '',
                    'weight': '',
                    'foot': '',
                    'birthDate': '',
                    'rating': '',
                    'photo': '',
                    'playerId': player_id,
                }
                
                # Buscar datos en el contenedor
                container_text = container.get_text()
                
                # Número
                squad_badge = container.find(class_=['squad-number-footer', 'squad-number'])
                if squad_badge:
                    player_data['squadNumber'] = squad_badge.get_text(strip=True)
                
                # Foto
                img = container.find('img')
                if img:
                    src = img.get('data-src', img.get('src', ''))
                    if 'player' in src:
                        player_data['photo'] = src
                
                # Nacionalidad
                flag = container.find(class_='flag-icon')
                if flag:
                    classes = flag.get('class', [])
                    for cls in classes:
                        if cls.startswith('flag-icon-') and cls != 'flag-icon':
                            player_data['nationality'] = cls.replace('flag-icon-', '').upper()
                
                players.append(player_data)
        
        return {
            'clubName': club_name,
            'clubId': club_id,
            'clubInfo': club_info,
            'players': players,
            'totalPlayers': len(players)
        }
    
    def parse_player(self, html, url):
        """Parsear TODA la información del jugador desde ficha.html"""
        soup = BeautifulSoup(html, 'html.parser')
        
        player_data = {
            # Datos básicos
            'playerId': '',
            'fullName': '',
            'shirtName': '',
            'position': '',
            'positionCode': '',
            'rating': '',
            
            # Datos personales
            'age': '',
            'birthDate': '',
            'birthPlace': '',
            
            # Nacionalidad
            'nationality': '',
            'nationalityCode': '',
            
            # Físico
            'height': '',  # en cm
            'weight': '',  # en kg
            
            # Club actual
            'currentClub': '',
            'currentClubId': '',
            'squadNumber': '',
            
            # Características físicas
            'preferredFoot': '',
            'hairColour': '',
            'hairstyle': '',
            'skinColour': '',
            'facialHair': '',
            
            # Foto
            'photo': '',
            'actionPhoto': '',
            'peakPhoto': '',
            'youthPhoto': '',
            'profilePhoto': '',
            'youthProfilePhoto': '',
            
            # URLs
            'url': url,
        }
        
        # Extraer player ID
        if 'pid=' in url:
            player_data['playerId'] = url.split('pid=')[1].split('&')[0]
        
        # Buscar en el contenido principal
        content = soup.find('div', class_='player-info-corporate')
        if not content:
            content = soup.find('div', class_='player-info-main')
        if not content:
            content = soup.find('main') or soup.find('article') or soup.find('div', class_='container')
        
        if content:
            text_content = content.get_text()
            
            # Nombre completo
            full_name_elem = content.find('p', class_='player-info-subtitle')
            if full_name_elem and 'Nombre completo' in str(full_name_elem):
                full_text = full_name_elem.get_text()
                if ':' in full_text:
                    player_data['fullName'] = full_text.split(':')[1].strip()
            
            # Si no encontramos por clase, buscar por patrón en todo el HTML
            all_ps = soup.find_all('p', class_='player-info-subtitle')
            for p in all_ps:
                p_text = p.get_text()
                
                if 'Nombre completo' in p_text and ':' in p_text:
                    player_data['fullName'] = p_text.split(':', 1)[1].strip()
                    
                elif 'Nombre de la camisa' in p_text and ':' in p_text:
                    player_data['shirtName'] = p_text.split(':', 1)[1].strip()
                    
                elif 'Posición' in p_text and ':' in p_text:
                    pos_text = p_text.split(':', 1)[1].strip()
                    # Extraer código (PO, D, MD, M, MO, A) y posición completa
                    span = p.find('span', {'title': True})
                    if span:
                        player_data['positionCode'] = span.get_text(strip=True)
                        player_data['position'] = span.get('title', '')
                    else:
                        player_data['position'] = pos_text
                    
                elif 'Valoración' in p_text and ':' in p_text:
                    rating_text = p_text.split(':', 1)[1].strip()
                    rating_match = re.search(r'(\d{1,3})', rating_text)
                    if rating_match:
                        rating = int(rating_match.group(1))
                        if 1 <= rating <= 99:
                            player_data['rating'] = str(rating)
                    
                elif 'Edad' in p_text and ':' in p_text:
                    age_text = p_text.split(':', 1)[1].strip()
                    # Formato: "36 (Jun 25, 1989)"
                    age_match = re.search(r'^(\d+)', age_text)
                    if age_match:
                        player_data['age'] = age_match.group(1)
                    
                    # Fecha de nacimiento
                    date_match = re.search(r'\(([^)]+)\)', age_text)
                    if date_match:
                        player_data['birthDate'] = date_match.group(1).strip()
                    
                elif 'Nación' in p_text or 'Nacionalidad' in p_text:
                    if ':' in p_text:
                        nation_text = p_text.split(':', 1)[1].strip()
                        # Buscar bandera
                        flag = p.find(class_='flag-icon')
                        if flag:
                            classes = flag.get('class', [])
                            for cls in classes:
                                if cls.startswith('flag-icon-') and cls != 'flag-icon':
                                    player_data['nationalityCode'] = cls.replace('flag-icon-', '').upper()
                        # El texto puede contener el nombre del país
                        # Eliminar el link de la bandera
                        nation_link = p.find('a')
                        if nation_link:
                            nation_text = nation_text.replace(nation_link.get_text(strip=True), '').strip()
                        player_data['nationality'] = nation_text.strip()
                    
                elif 'Altura' in p_text and ':' in p_text:
                    height_text = p_text.split(':', 1)[1].strip()
                    height_match = re.search(r'(\d{2,3})', height_text)
                    if height_match:
                        h = int(height_match.group(1))
                        if 140 <= h <= 220:
                            player_data['height'] = str(h)
                    
                elif 'Peso' in p_text and ':' in p_text:
                    weight_text = p_text.split(':', 1)[1].strip()
                    weight_match = re.search(r'(\d{2,3})', weight_text)
                    if weight_match:
                        w = int(weight_match.group(1))
                        if 40 <= w <= 150:
                            player_data['weight'] = str(w)
                    
                elif 'Club' in p_text and ':' in p_text:
                    club_text = p_text.split(':', 1)[1].strip()
                    club_link = p.find('a', href=lambda x: x and 'squad.php' in x)
                    if club_link:
                        player_data['currentClub'] = club_link.get_text(strip=True)
                        href = club_link.get('href', '')
                        if 'clubid=' in href:
                            player_data['currentClubId'] = href.split('clubid=')[1].split('&')[0]
                    else:
                        player_data['currentClub'] = club_text.strip()
                    
                elif 'Squad Number' in p_text and ':' in p_text:
                    squad_text = p_text.split(':', 1)[1].strip()
                    player_data['squadNumber'] = squad_text
                    
                elif 'Pie preferido' in p_text and ':' in p_text:
                    foot_text = p_text.split(':', 1)[1].strip()
                    player_data['preferredFoot'] = foot_text
                    
                elif 'Hair Colour' in p_text and ':' in p_text:
                    hair_text = p_text.split(':', 1)[1].strip()
                    player_data['hairColour'] = hair_text
                    
                elif 'Hairstyle' in p_text and ':' in p_text:
                    hair_style_text = p_text.split(':', 1)[1].strip()
                    player_data['hairstyle'] = hair_style_text
                    
                elif 'Skin Colour' in p_text and ':' in p_text:
                    skin_text = p_text.split(':', 1)[1].strip()
                    player_data['skinColour'] = skin_text
                    
                elif 'Facial Hair' in p_text and ':' in p_text:
                    facial_text = p_text.split(':', 1)[1].strip()
                    player_data['facialHair'] = facial_text
            
            # Buscar número de camiseta en el bloque de número
            squad_number_div = content.find('div', class_='block-number')
            if squad_number_div:
                squad_span = squad_number_div.find('span')
                if squad_span:
                    num = squad_span.get_text(strip=True)
                    if num.isdigit():
                        player_data['squadNumber'] = num
            
            # Buscar fotos
            player_img_div = content.find('div', class_='player-img')
            if player_img_div:
                player_img = player_img_div.find('img')
                if player_img:
                    player_data['photo'] = player_img.get('data-src', player_img.get('src', ''))
            
            # Buscar fotos de acción
            action_divs = content.find_all('div', class_='player-info-figure')
            for i, div in enumerate(action_divs):
                img = div.find('img')
                if img:
                    src = img.get('data-src', img.get('src', ''))
                    if 'action' in src.lower():
                        player_data['actionPhoto'] = src
                    elif 'peak' in src.lower():
                        player_data['peakPhoto'] = src
                    elif 'youth' in src.lower() and 'profile' not in src.lower():
                        player_data['youthPhoto'] = src
                    elif 'profile' in src.lower():
                        if 'youth' in src.lower():
                            player_data['youthProfilePhoto'] = src
                        else:
                            player_data['profilePhoto'] = src
        
        # Si no encontramos en player-info-subtitle, buscar directamente en el HTML
        if not player_data['fullName']:
            # Buscar por el título de la página
            title = soup.find('title')
            if title:
                title_text = title.get_text()
                # El formato es "Nombre - Soccer Wiki: ..."
                if ' - ' in title_text:
                    player_data['fullName'] = title_text.split(' - ')[0].strip()
        
        # Buscar número de camiseta
        squad_badges = soup.find_all(['span', 'div'], class_=['squad-number-footer', 'squad-number'])
        for badge in squad_badges:
            num = badge.get_text(strip=True)
            if num.isdigit() and not player_data['squadNumber']:
                player_data['squadNumber'] = num
                break
        
        # Buscar bandera de nacionalidad
        flags = soup.find_all(class_='flag-icon')
        for flag in flags:
            classes = flag.get('class', [])
            for cls in classes:
                if cls.startswith('flag-icon-') and cls != 'flag-icon':
                    if not player_data['nationalityCode']:
                        player_data['nationalityCode'] = cls.replace('flag-icon-', '').upper()
                    break
            break
        
        # Buscar posición
        pos_spans = soup.find_all('span', {'title': True})
        for span in pos_spans:
            title = span.get('title', '')
            if title in ['Portero', 'Goalkeeper', 'Defensa', 'Defender', 
                        'Centrocampista', 'Midfielder', 'Delantero', 'Forward']:
                if not player_data['position']:
                    player_data['position'] = title
                if not player_data['positionCode']:
                    player_data['positionCode'] = span.get_text(strip=True)
                break
        
        # Buscar altura y peso en el texto
        all_text = soup.get_text()
        
        if not player_data['height']:
            height_match = re.search(r'(\d{2,3})\s*cm', all_text, re.I)
            if height_match:
                h = int(height_match.group(1))
                if 140 <= h <= 220:
                    player_data['height'] = str(h)
        
        if not player_data['weight']:
            weight_match = re.search(r'(\d{2,3})\s*kg', all_text, re.I)
            if weight_match:
                w = int(weight_match.group(1))
                if 40 <= w <= 150:
                    player_data['weight'] = str(w)
        
        # Buscar edad
        if not player_data['age']:
            age_match = re.search(r'(\d{1,2})\s*años?', all_text, re.I)
            if age_match:
                player_data['age'] = age_match.group(1)
        
        # Buscar fecha de nacimiento
        if not player_data['birthDate']:
            date_match = re.search(r'(\w+)\s+(\d{1,2}),?\s+(\d{4})', all_text)
            if date_match:
                player_data['birthDate'] = f"{date_match.group(1)} {date_match.group(2)}, {date_match.group(3)}"
        
        # Buscar pie preferido
        if not player_data['preferredFoot']:
            if 'Izquierdo' in all_text or 'Left' in all_text:
                player_data['preferredFoot'] = 'Izquierdo'
            elif 'Derecho' in all_text or 'Right' in all_text:
                player_data['preferredFoot'] = 'Derecho'
            elif 'Ambos' in all_text or 'Both' in all_text:
                player_data['preferredFoot'] = 'Ambos'
        
        # Buscar foto principal
        main_img = soup.find('img', class_='player-img')
        if main_img:
            player_data['photo'] = main_img.get('data-src', main_img.get('src', ''))
        
        # Si sigue sin tener foto, buscar cualquier imagen de jugador
        if not player_data['photo']:
            imgs = soup.find_all('img')
            for img in imgs:
                src = img.get('data-src', img.get('src', ''))
                if f'/player/{player_data["playerId"]}' in src:
                    player_data['photo'] = src
                    break
        
        # Buscar club actual
        if not player_data['currentClub']:
            club_links = soup.find_all('a', href=lambda x: x and 'squad.php' in x)
            for link in club_links:
                text = link.get_text(strip=True)
                if text and len(text) > 2:
                    player_data['currentClub'] = text
                    href = link.get('href', '')
                    if 'clubid=' in href:
                        player_data['currentClubId'] = href.split('clubid=')[1].split('&')[0]
                    break
        
        return player_data
    
    def display_clubs(self, clubs):
        """Mostrar clubes en grid"""
        for widget in self.content_frame.winfo_children():
            widget.destroy()
        
        # Header
        header_frame = tk.Frame(self.content_frame, bg='white')
        header_frame.pack(fill=tk.X, pady=10)
        
        tk.Label(header_frame, text=f"Clubes ({len(clubs)})",
                font=('Segoe UI', 18, 'bold'),
                bg='white', fg='#1e3c72').pack(side=tk.LEFT, padx=10)
        
        # Búsqueda
        search_frame = tk.Frame(header_frame, bg='white')
        search_frame.pack(side=tk.RIGHT, padx=10)
        
        tk.Label(search_frame, text="🔍", bg='white', 
                font=('Segoe UI', 12)).pack(side=tk.LEFT)
        
        self.search_var = tk.StringVar()
        self.search_var.trace('w', lambda *args: self.filter_clubs())
        
        search_entry = tk.Entry(search_frame, textvariable=self.search_var,
                               font=('Segoe UI', 10), width=30)
        search_entry.pack(side=tk.LEFT, padx=5)
        
        # Botón descargar
        download_btn = ttk.Button(header_frame, text="📥 Descargar JSON",
                                 style='Success.TButton',
                                 command=self.download_json)
        download_btn.pack(side=tk.RIGHT, padx=10)
        
        # Grid de clubes
        self.clubs_container = tk.Frame(self.content_frame, bg='white')
        self.clubs_container.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        row = 0
        col = 0
        max_cols = 4
        
        self.club_cards = []
        
        for club in clubs:
            card = self.create_club_card(self.clubs_container, club)
            card.grid(row=row, column=col, padx=8, pady=8, sticky='nsew')
            self.club_cards.append((card, club))
            
            col += 1
            if col >= max_cols:
                col = 0
                row += 1
        
        for i in range(max_cols):
            self.clubs_container.grid_columnconfigure(i, weight=1)
    
    def create_club_card(self, parent, club):
        """Crear card de club"""
        card = tk.Frame(parent, bg='white', relief=tk.RAISED, bd=2, cursor='hand2')
        card.bind('<Enter>', lambda e: card.configure(relief=tk.SOLID, bd=3))
        card.bind('<Leave>', lambda e: card.configure(relief=tk.RAISED, bd=2))
        card.bind('<Button-1>', lambda e: self.load_url(club['url']))
        
        # Logo
        logo_label = tk.Label(card, text="⚽", font=('Segoe UI', 30), bg='white')
        logo_label.pack(pady=(10, 5))
        
        # Nombre
        name_label = tk.Label(card, text=club['name'],
                             font=('Segoe UI', 11, 'bold'),
                             bg='white', fg='#2c3e50',
                             wraplength=180)
        name_label.pack(pady=5)
        
        # Liga
        league_label = tk.Label(card, text=club['league'],
                               font=('Segoe UI', 8),
                               bg='#3498db', fg='white',
                               padx=8, pady=2)
        league_label.pack(pady=5)
        
        # Info
        info_text = f"📍 {club['location']}\n📅 {club['foundationYear']}"
        info_label = tk.Label(card, text=info_text,
                             font=('Segoe UI', 8),
                             bg='white', fg='#7f8c8d')
        info_label.pack(pady=(5, 10))
        
        # Bind click a todos los widgets
        def bind_click(widget):
            widget.bind('<Button-1>', lambda e: self.load_url(club['url']))
            widget.configure(cursor='hand2')
            for child in widget.winfo_children():
                bind_click(child)
        
        bind_click(card)
        
        return card
    
    def display_full_club(self, data):
        """Mostrar TODA la información del club en UNA PÁGINA"""
        for widget in self.content_frame.winfo_children():
            widget.destroy()
        
        # Header del club
        header_frame = tk.Frame(self.content_frame, bg='white')
        header_frame.pack(fill=tk.X, pady=15, padx=20)
        
        # Título
        title_frame = tk.Frame(header_frame, bg='white')
        title_frame.pack(side=tk.LEFT)
        
        tk.Label(title_frame, text=data['clubName'],
                font=('Segoe UI', 24, 'bold'),
                bg='white', fg='#1e3c72').pack(anchor='w')
        
        tk.Label(title_frame, text=f"{data['totalPlayers']} jugadores en el plantel",
                font=('Segoe UI', 12),
                bg='white', fg='#666').pack(anchor='w', pady=(5, 0))
        
        # Botón descargar
        download_btn = ttk.Button(header_frame, text="📥 Descargar JSON",
                                 style='Success.TButton',
                                 command=self.download_json)
        download_btn.pack(side=tk.RIGHT)
        
        # Información del club
        if any(data['clubInfo'].values()):
            info_frame = tk.Frame(self.content_frame, bg='#ecf0f1')
            info_frame.pack(fill=tk.X, pady=10, padx=20)
            
            info_text = []
            if data['clubInfo']['stadium']:
                info_text.append(f"🏟️ Estadio: {data['clubInfo']['stadium']}")
            if data['clubInfo']['capacity']:
                info_text.append(f"👥 Capacidad: {data['clubInfo']['capacity']}")
            if data['clubInfo']['coach']:
                info_text.append(f"👔 Entrenador: {data['clubInfo']['coach']}")
            
            if info_text:
                tk.Label(info_frame, text=" | ".join(info_text),
                        font=('Segoe UI', 10),
                        bg='#ecf0f1', fg='#2c3e50',
                        padx=15, pady=10).pack()
        
        # TABLA COMPLETA DE JUGADORES
        table_frame = tk.Frame(self.content_frame, bg='white')
        table_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=10)
        
        tk.Label(table_frame, text="📋 PLANTEL COMPLETO",
                font=('Segoe UI', 14, 'bold'),
                bg='white', fg='#1e3c72').pack(anchor='w', pady=(0, 10))
        
        # Crear Treeview con más columnas para datos completos
        columns = ('Nº', 'Nombre', 'Posición', 'Nac', 'Edad', 'Altura', 'Peso', 'Pie', 'Club', 'Rating')
        
        tree_scroll = ttk.Scrollbar(table_frame)
        tree_scroll.pack(side=tk.RIGHT, fill=tk.Y)
        
        self.tree = ttk.Treeview(table_frame, 
                                 columns=columns,
                                 show='headings',
                                 style='Custom.Treeview',
                                 yscrollcommand=tree_scroll.set,
                                 height=25)
        
        tree_scroll.config(command=self.tree.yview)
        
        # Configurar columnas
        widths = {'Nº': 45, 'Nombre': 180, 'Posición': 100, 'Nac': 55, 
                 'Edad': 50, 'Altura': 65, 'Peso': 60, 'Pie': 70, 
                 'Club': 120, 'Rating': 55}
        
        for col in columns:
            self.tree.heading(col, text=col, anchor='center')
            self.tree.column(col, width=widths.get(col, 100), anchor='center')
        
        # Insertar datos
        for i, player in enumerate(data['players']):
            values = (
                player['squadNumber'] or '-',
                player['name'] or '-',
                player.get('positionCode', player.get('position', '-')),
                player.get('nationalityCode', player.get('nationality', '-')),
                player.get('age', '-'),
                player.get('height', '-') or '-',
                player.get('weight', '-') or '-',
                player.get('preferredFoot', '-') or '-',
                player.get('currentClub', '-') or '-',
                player.get('rating', '-') or '-'
            )
            
            # Alternar colores
            tag = 'evenrow' if i % 2 == 0 else 'oddrow'
            self.tree.insert('', tk.END, values=values, tags=(tag,))
        
        # Configurar tags para colores
        self.tree.tag_configure('evenrow', background='#f8f9fa')
        self.tree.tag_configure('oddrow', background='white')
        
        self.tree.pack(fill=tk.BOTH, expand=True)
        
        # Estadísticas resumen
        stats_frame = tk.Frame(self.content_frame, bg='#ecf0f1')
        stats_frame.pack(fill=tk.X, pady=15, padx=20)
        
        # Calcular estadísticas
        positions = {}
        nationalities = {}
        avg_age = 0
        age_count = 0
        
        for player in data['players']:
            # Usar positionCode o position
            pos = player.get('positionCode') or player.get('position', '')
            if pos:
                positions[pos] = positions.get(pos, 0) + 1
            
            # Usar nationalityCode o nationality
            nat = player.get('nationalityCode') or player.get('nationality', '')
            if nat:
                nationalities[nat] = nationalities.get(nat, 0) + 1
            
            if player.get('age'):
                try:
                    avg_age += int(player['age'])
                    age_count += 1
                except:
                    pass
        
        if age_count > 0:
            avg_age = round(avg_age / age_count, 1)
        
        stats_text = f"📊 Resumen: "
        if positions:
            pos_text = ", ".join([f"{k}: {v}" for k, v in sorted(positions.items(), key=lambda x: -x[1])[:3]])
            stats_text += f"Posiciones: {pos_text} | "
        if avg_age:
            stats_text += f"Edad promedio: {avg_age} años | "
        stats_text += f"Nacionalidades: {len(nationalities)}"
        
        tk.Label(stats_frame, text=stats_text,
                font=('Segoe UI', 10),
                bg='#ecf0f1', fg='#2c3e50',
                padx=15, pady=10).pack()
    
    def display_player(self, player):
        """Mostrar TODA la información del jugador"""
        for widget in self.content_frame.winfo_children():
            widget.destroy()
        
        # Foto y datos principales
        main_frame = tk.Frame(self.content_frame, bg='white')
        main_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=15)
        
        # Foto del jugador
        photo_frame = tk.Frame(main_frame, bg='white')
        photo_frame.pack(side=tk.LEFT, padx=(0, 20))
        
        # Placeholder para la foto
        photo_placeholder = tk.Label(photo_frame, text="📷", 
                                     font=('Segoe UI', 60), 
                                     bg='#ecf0f1', width=12, height=6)
        photo_placeholder.pack()
        
        if player.get('photo'):
            tk.Label(photo_frame, text="[Foto: " + player['photo'][:50] + "...]",
                    font=('Segoe UI', 8), bg='white', fg='#666').pack(pady=5)
        
        # Datos del jugador
        data_frame = tk.Frame(main_frame, bg='white')
        data_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        
        # Nombre
        tk.Label(data_frame, text=player.get('fullName', player.get('name', 'Jugador')),
                font=('Segoe UI', 24, 'bold'),
                bg='white', fg='#1e3c72').pack(anchor='w')
        
        # Club actual y número
        club_info = player.get('currentClub', 'Sin club')
        if player.get('squadNumber'):
            club_info += f" #{player['squadNumber']}"
        tk.Label(data_frame, text=club_info,
                font=('Segoe UI', 14),
                bg='white', fg='#666').pack(anchor='w', pady=(0, 10))
        
        # Botón descargar
        download_btn = ttk.Button(data_frame, text="📥 Descargar JSON",
                                 style='Success.TButton',
                                 command=self.download_json)
        download_btn.pack(anchor='e', pady=(0, 10))
        
        # Grid de información detallada
        info_grid = tk.Frame(data_frame, bg='white')
        info_grid.pack(fill=tk.X, pady=10)
        
        # Organizar en 3 columnas
        left_col = []
        center_col = []
        right_col = []
        
        # Columna izquierda - Datos básicos
        if player.get('rating'):
            left_col.append(("Valoración", player['rating']))
        if player.get('position'):
            left_col.append(("Posición", f"{player.get('positionCode', '')} - {player['position']}"))
        if player.get('age'):
            left_col.append(("Edad", player['age']))
        if player.get('birthDate'):
            left_col.append(("Nacimiento", player['birthDate']))
        
        # Columna centro - Datos físicos
        if player.get('nationality') or player.get('nationalityCode'):
            nation = player.get('nationality', '')
            code = player.get('nationalityCode', '')
            left_col.append(("Nacionalidad", f"{nation} ({code})"))
        if player.get('height'):
            center_col.append(("Altura", player['height'] + ' cm'))
        if player.get('weight'):
            center_col.append(("Peso", player['weight'] + ' kg'))
        if player.get('preferredFoot'):
            center_col.append(("Pie preferido", player['preferredFoot']))
        
        # Columna derecha - Apariencia
        if player.get('hairColour'):
            right_col.append(("Color de pelo", player['hairColour']))
            right_col.append(("Peinado", player['hairstyle']))
        if player.get('skinColour'):
            right_col.append(("Color de piel", player['skinColour']))
        if player.get('facialHair'):
            right_col.append(("Facial hair", player['facialHair']))
        
        # Mostrar primera columna
        row = 0
        for label, value in left_col:
            tk.Label(info_grid, text=label + ":", font=('Segoe UI', 10, 'bold'),
                    bg='white', fg='#2c3e50').grid(row=row, column=0, sticky='w', padx=(0, 15), pady=3)
            tk.Label(info_grid, text=value, font=('Segoe UI', 10),
                    bg='white', fg='#666').grid(row=row, column=1, sticky='w', pady=3)
            row += 1
        
        # Mostrar segunda columna
        row = 0
        for label, value in center_col:
            tk.Label(info_grid, text=label + ":", font=('Segoe UI', 10, 'bold'),
                    bg='white', fg='#2c3e50').grid(row=row, column=2, sticky='w', padx=(30, 15), pady=3)
            tk.Label(info_grid, text=value, font=('Segoe UI', 10),
                    bg='white', fg='#666').grid(row=row, column=3, sticky='w', pady=3)
            row += 1
        
        # Mostrar tercera columna
        row = 0
        for label, value in right_col:
            tk.Label(info_grid, text=label + ":", font=('Segoe UI', 10, 'bold'),
                    bg='white', fg='#2c3e50').grid(row=row, column=4, sticky='w', padx=(30, 15), pady=3)
            tk.Label(info_grid, text=value, font=('Segoe UI', 10),
                    bg='white', fg='#666').grid(row=row, column=5, sticky='w', pady=3)
            row += 1
        
        # Resumen
        summary_frame = tk.Frame(self.content_frame, bg='#ecf0f1')
        summary_frame.pack(fill=tk.X, padx=20, pady=15)
        
        summary_text = f"📊 Resumen del jugador: {player.get('fullName', 'N/A')}"
        if player.get('currentClub'):
            summary_text += f" | Club: {player['currentClub']}"
        if player.get('position'):
            summary_text += f" | Posición: {player['position']}"
        if player.get('rating'):
            summary_text += f" | Rating: {player['rating']}"
        
        tk.Label(summary_frame, text=summary_text,
                font=('Segoe UI', 10),
                bg='#ecf0f1', fg='#2c3e50',
                padx=15, pady=10).pack()
    
    def filter_clubs(self):
        """Filtrar clubes"""
        search_term = self.search_var.get().lower()
        
        if hasattr(self, 'club_cards'):
            for card, club in self.club_cards:
                text = f"{club['name']} {club['location']} {club['league']}".lower()
                if search_term in text:
                    card.grid()
                else:
                    card.grid_remove()
    
    def update_breadcrumb(self):
        """Actualizar breadcrumb"""
        text = "🏠 Inicio"
        
        if self.current_type == 'clubs':
            text += " > Clubes"
        elif self.current_type == 'squad':
            text += f" > Clubes > {self.current_data['clubName']}"
        elif self.current_type == 'player':
            player_name = self.current_data.get('fullName', self.current_data.get('name', 'Jugador'))
            text += f" > Jugador: {player_name}"
        
        self.breadcrumb.configure(text=text)
    
    def download_json(self):
        """Descargar datos como JSON"""
        if not self.current_data:
            messagebox.showwarning("Advertencia", "No hay datos para descargar")
            return
        
        # Campos a excluir
        exclude_fields = {'currentClubId', 'preferredFoot', 'hairColour', 'hairstyle', 
                         'skinColour', 'facialHair', 'url', 'playerId', 'squadNumber'}
        
        # Filtrar datos para excluir campos no deseados
        def filter_data(data):
            if isinstance(data, dict):
                filtered = {}
                for key, value in data.items():
                    if key in exclude_fields:
                        continue
                    if key == 'players' and isinstance(value, list):
                        filtered[key] = [filter_data(player) for player in value]
                    else:
                        filtered[key] = filter_data(value)
                return filtered
            elif isinstance(data, list):
                return [filter_data(item) for item in data]
            return data
        
        filtered_data = filter_data(self.current_data)
        
        if self.current_type == 'clubs':
            default_name = 'clubes.json'
        elif self.current_type == 'player':
            player_name = self.current_data.get('fullName', self.current_data.get('name', 'jugador'))
            default_name = f"jugador_{player_name.replace(' ', '_')}.json"
        else:
            default_name = f"plantel_{self.current_data['clubName'].replace(' ', '_')}.json"
        
        filename = filedialog.asksaveasfilename(
            defaultextension='.json',
            filetypes=[('JSON files', '*.json'), ('All files', '*.*')],
            initialfile=default_name
        )
        
        if filename:
            try:
                with open(filename, 'w', encoding='utf-8') as f:
                    json.dump(filtered_data, f, ensure_ascii=False, indent=2)
                messagebox.showinfo("Éxito", f"Datos guardados en:\n{filename}")
            except Exception as e:
                messagebox.showerror("Error", f"No se pudo guardar el archivo:\n{str(e)}")


def main():
    root = tk.Tk()
    app = SoccerWikiApp(root)
    root.mainloop()


if __name__ == '__main__':
    main()