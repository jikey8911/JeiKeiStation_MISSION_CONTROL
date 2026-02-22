import os
from typing import Optional

import git
from github import Github, GithubException
from colorama import Fore, Style

# --- Constantes y Configuración ---
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN")

class DevOpsAgent:
    """
    Agente de DevOps para automatizar tareas de Git y GitHub.
    """
    def __init__(self, repo_path: str = ".", remote_name: str = "origin"):
        try:
            self.repo = git.Repo(repo_path, search_parent_directories=True)
            self.repo_path = self.repo.working_dir
        except git.InvalidGitRepositoryError:
            print(f"{Fore.RED}[ERROR] La ruta '{os.path.abspath(repo_path)}' no es un repositorio Git válido.{Style.RESET_ALL}")
            raise
        
        self.remote = self.repo.remote(name=remote_name)
        self.github_client = Github(GITHUB_TOKEN) if GITHUB_TOKEN else None
        self.github_repo = self._get_github_repo()
        
        if self.github_repo:
            print(f"{Fore.CYAN}[INFO] Conectado al repositorio de GitHub: {self.github_repo.full_name}{Style.RESET_ALL}")

    def _get_github_repo(self):
        if not self.github_client:
            return None
        
        url = self.remote.url
        # Manejo de URLs HTTPS y SSH
        if url.startswith("git@"):
            repo_full_name = url.split(':')[-1].replace('.git', '')
        else:
            repo_full_name = '/'.join(url.split('/')[-2:]).replace('.git', '')

        try:
            return self.github_client.get_repo(repo_full_name)
        except GithubException as e:
            print(f"{Fore.RED}[ERROR] No se pudo encontrar el repositorio de GitHub '{repo_full_name}'.{Style.RESET_ALL}")
            return None

    def create_branch(self, branch_name: str) -> Optional[git.Head]:
        try:
            if branch_name in self.repo.heads:
                print(f"{Fore.YELLOW}[WARN] La rama '{branch_name}' ya existe. Haciendo checkout...{Style.RESET_ALL}")
                self.repo.heads[branch_name].checkout()
                return self.repo.heads[branch_name]

            new_branch = self.repo.create_head(branch_name)
            new_branch.checkout()
            print(f"{Fore.GREEN}[SUCCESS] Rama '{branch_name}' creada y activa.{Style.RESET_ALL}")
            return new_branch
        except git.GitCommandError as e:
            print(f"{Fore.RED}[ERROR] No se pudo crear o cambiar a la rama '{branch_name}'.{Style.RESET_ALL}")
            return None

    def apply_changes(self, file_path: str, new_content: str) -> bool:
        full_path = os.path.join(self.repo_path, file_path)
        try:
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            
            self.repo.git.add(full_path)
            print(f"{Fore.GREEN}[SUCCESS] Cambios aplicados y añadidos al staging para '{file_path}'.{Style.RESET_ALL}")
            return True
        except Exception as e:
            print(f"{Fore.RED}[ERROR] No se pudo escribir en el archivo '{file_path}': {e}{Style.RESET_ALL}")
            return False

    def commit_and_push(self, commit_message: str) -> bool:
        try:
            if not self.repo.is_dirty(untracked_files=True):
                print(f"{Fore.YELLOW}[WARN] No hay cambios para hacer commit.{Style.RESET_ALL}")
                return True

            self.repo.index.commit(commit_message)
            current_branch = self.repo.active_branch
            print(f"{Fore.GREEN}[SUCCESS] Commit realizado: '{commit_message}'{Style.RESET_ALL}")

            self.remote.push(refspec=f'{current_branch}:{current_branch}')
            print(f"{Fore.GREEN}[SUCCESS] Push a la rama '{current_branch}' exitoso.{Style.RESET_ALL}")
            return True
        except git.GitCommandError as e:
            print(f"{Fore.RED}[ERROR] Falló el commit o el push: {e}{Style.RESET_ALL}")
            return False

    def open_pull_request(self, title: str, body: str, base_branch: str = "main") -> Optional[str]:
        if not self.github_repo:
            print(f"{Fore.RED}[ERROR] Cliente de GitHub no inicializado.{Style.RESET_ALL}")
            return None

        try:
            head_branch = self.repo.active_branch.name
            pr = self.github_repo.create_pull(
                title=title,
                body=body,
                head=head_branch,
                base=base_branch
            )
            print(f"{Fore.GREEN}[SUCCESS] Pull Request creado: {pr.html_url}{Style.RESET_ALL}")
            return pr.html_url
        except GithubException as e:
            if e.status == 422 and "A pull request already exists" in str(e.data):
                print(f"{Fore.YELLOW}[WARN] Ya existe un Pull Request para la rama '{self.repo.active_branch.name}'.{Style.RESET_ALL}")
                return "PR ya existente."
            print(f"{Fore.RED}[ERROR] No se pudo crear el Pull Request: {e}{Style.RESET_ALL}")
            return None
